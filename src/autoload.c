#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>
#include <fcntl.h>

#include "next_menu.h"
#include "autoload.h"
#include "payload_mgr.h"
#include "ps5_launcher.h"

static volatile int abort_flag = 0;
static volatile int remaining_seconds = -1;
static pthread_t autoload_thread;

static char autoload_current_name[128] = "";
static int autoload_total_count = 0;
static int autoload_done_count = 0;

int nm_autoload_get_remaining_seconds() {
    return remaining_seconds;
}

void nm_autoload_get_status(int *total, int *done, char *current) {
    *total = autoload_total_count;
    *done = autoload_done_count;
    if (current) strcpy(current, autoload_current_name);
}

void* nm_autoload_worker(void* arg) {
    struct stat st;
    int has_config = (stat(AUTOLOAD_CONFIG_PATH, &st) == 0);
    
    int enabled = 0;
    int browser_open = 1;
    int auto_delay = 5;

    FILE *ef = fopen(NEXT_CONFIG_PATH, "r");
    if (ef) {
        char line[128];
        while (fgets(line, sizeof(line), ef)) {
            if (strncmp(line, "AUTOLOAD_ENABLED=", 17) == 0) {
                enabled = atoi(line + 17);
            } else if (strncmp(line, "AUTO_BROWSER_OPEN=", 18) == 0) {
                browser_open = atoi(line + 18);
            } else if (strncmp(line, "AUTOLOAD_DELAY=", 15) == 0) {
                auto_delay = atoi(line + 15);
            }
        }
        fclose(ef);
    }

    if (!enabled || !has_config) return NULL;

    /* Perform countdown for the specified delay in all modes */
    if (auto_delay > 0) {
        int klog_fd = -1;
        
        /* Only fallback to on-screen notification and PS button if browser is NOT automatically opened */
        if (!browser_open) {
            if (!nm_server_is_active()) {
                char ip[64];
                if (nm_get_local_ip(ip, sizeof(ip)) != 0) strcpy(ip, "0.0.0.0");
                nm_notify("Next Menu Running\nhttp://%s:%d", ip, MENU_PORT);
                nm_notify("Autoloading in %ds\nPress PS Button to Abort", auto_delay);
            }

            klog_fd = open("/dev/klog", O_RDONLY | O_NONBLOCK);
            if (klog_fd >= 0) {
                /* Flush existing log buffer so we only catch NEW button presses */
                char flush_buf[4096];
                while (read(klog_fd, flush_buf, sizeof(flush_buf)) > 0);
            }
            nm_log("[Autoload] Fallback Mode: Starting %ds countdown (PS Button active)...\n", auto_delay);
        } else {
            nm_log("[Autoload] Browser Mode: Starting %ds countdown...\n", auto_delay);
        }
        
        char klog_buf[2048];
        for (int i = auto_delay; i > 0; i--) {
            remaining_seconds = i;
            for (int j = 0; j < 10; j++) {
                if (abort_flag) {
                    if (klog_fd >= 0) close(klog_fd);
                    remaining_seconds = -1;
                    return NULL;
                }

                if (klog_fd >= 0) {
                    ssize_t n = read(klog_fd, klog_buf, sizeof(klog_buf) - 1);
                    if (n > 0) {
                        klog_buf[n] = 0;
                        if (strstr(klog_buf, "onPSButtonPressed")) {
                            nm_log("[Autoload] ABORTED via PS Button.\n");
                            nm_notify("Autoload Aborted");
                            abort_flag = 1;
                            close(klog_fd);
                            remaining_seconds = -1;
                            return NULL;
                        }
                    }
                }
                usleep(100000); /* 100ms */
            }
        }
        if (klog_fd >= 0) close(klog_fd);
    }
    remaining_seconds = 0;
    
    FILE *f = fopen(AUTOLOAD_CONFIG_PATH, "r");
    if (!f) {
        nm_log("[Autoload] !!! Failed to open %s\n", AUTOLOAD_CONFIG_PATH);
        remaining_seconds = -1;
        return NULL;
    }

    nm_log("[Autoload] Starting sequence...\n");
    
    /* Count total first for UI */
    autoload_total_count = 0;
    autoload_done_count = 0;
    char count_line[256];
    while (fgets(count_line, sizeof(count_line), f)) {
        if (count_line[0] != '!' && strlen(count_line) > 1) autoload_total_count++;
    }
    rewind(f);
    
    char line[256];
    while (fgets(line, sizeof(line), f)) {
        if (abort_flag) {
            nm_log("[Autoload] ABORTED during execution.\n");
            break;
        }

        line[strcspn(line, "\r\n")] = 0;
        if (strlen(line) == 0) continue;

        if (line[0] == '!') {
            int delay = atoi(line + 1);
            if (delay > 0) {
                nm_log("[Autoload] Delaying for %d ms...\n", delay);
                /* Sleep in 100ms chunks to check for abort_flag */
                for (int d = 0; d < delay; d += 100) {
                    if (abort_flag) break;
                    usleep(100000);
                }
            }
        } else {
            char full_path[512];
            if (payload_mgr_resolve_path(line, full_path, sizeof(full_path)) == 0) {
                strncpy(autoload_current_name, line, sizeof(autoload_current_name) - 1);
                nm_log("[Autoload] Launching: %s\n", full_path);
                ps5_launch_elf(full_path);
                autoload_done_count++;
                usleep(500000); /* UI visibility */
            } else {
                nm_log("[Autoload] !!! Payload not found: %s\n", line);
            }
        }
    }

    fclose(f);
    nm_log("[Autoload] Sequence complete.\n");
    strcpy(autoload_current_name, "DONE");
    remaining_seconds = 0;
    return NULL;
}

int nm_autoload_start() {
    abort_flag = 0;
    if (pthread_create(&autoload_thread, NULL, nm_autoload_worker, NULL) != 0) {
        nm_log("[Autoload] !!! Failed to create background thread\n");
        return -1;
    }
    pthread_detach(autoload_thread);
    return 0;
}

void nm_autoload_abort() {
    abort_flag = 1;
}

void nm_autoload_reset() {
    remaining_seconds = -1;
    autoload_total_count = 0;
    autoload_done_count = 0;
    strcpy(autoload_current_name, "");
}

void nm_autoload_update_config_entry(const char *old_filename, const char *new_filename) {
    FILE *f = fopen(AUTOLOAD_CONFIG_PATH, "r");
    if (!f) return;

    char lines[100][256];
    int line_count = 0;
    int modified = 0;

    while (fgets(lines[line_count], sizeof(lines[0]), f) && line_count < 100) {
        char clean_line[256];
        strcpy(clean_line, lines[line_count]);
        clean_line[strcspn(clean_line, "\r\n")] = 0;
        
        if (strcmp(clean_line, old_filename) == 0) {
            modified = 1;
            if (new_filename) {
                snprintf(lines[line_count], sizeof(lines[0]), "%s\n", new_filename);
                line_count++;
            }
            /* If new_filename is NULL, we just skip incrementing line_count, effectively deleting it */
        } else {
            line_count++;
        }
    }
    fclose(f);

    if (modified) {
        f = fopen(AUTOLOAD_CONFIG_PATH, "w");
        if (f) {
            for (int i = 0; i < line_count; i++) {
                fputs(lines[i], f);
            }
            fclose(f);
            nm_log("[Autoload] Config updated: replaced/removed %s\n", old_filename);
        }
    }
}
