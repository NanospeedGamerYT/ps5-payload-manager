#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include "next_menu.h"
#include "ps5_launcher.h"

#include <stdint.h>

int ps5_launch_elf(const char* path) {
    nm_log("[NextMenu] Sending ELF to local loader: %s\n", path);

    /* Open the payload file */
    int fd = open(path, O_RDONLY);
    if (fd < 0) {
        nm_log("[NextMenu] !!! Failed to open payload: %s\n", path);
        return -1;
    }

    struct stat st;
    fstat(fd, &st);
    size_t total_sent = 0;

    /* Create socket to local elfldr */
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) {
        perror("socket");
        close(fd);
        return -1;
    }

    struct sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(ELFLDR_PORT);
    server_addr.sin_addr.s_addr = inet_addr("127.0.0.1");

    if (connect(sock, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        nm_log("[NextMenu] !!! Connection to loader (port %d) failed. Is it running?\n", ELFLDR_PORT);
        close(sock);
        close(fd);
        return -1;
    }

    /* Stream the file */
    char buffer[16384];
    ssize_t read_bytes;
    while ((read_bytes = read(fd, buffer, sizeof(buffer))) > 0) {
        ssize_t sent = send(sock, buffer, read_bytes, 0);
        if (sent < 0) {
            perror("send");
            break;
        }
        total_sent += sent;
    }

    nm_log("[NextMenu] Sent %zu bytes to loader.\n", total_sent);

    close(sock);
    close(fd);
    return 0;
}

extern int sceSystemServiceLaunchWebBrowser(const char *uri);

int ps5_launch_browser(const char* uri) {
    nm_log("[NextMenu] Launching browser: %s\n", uri);
    if (sceSystemServiceLaunchWebBrowser(uri) != 0) {
        nm_log("[NextMenu] !!! Failed to launch browser.\n");
        return -1;
    }
    return 0;
}
