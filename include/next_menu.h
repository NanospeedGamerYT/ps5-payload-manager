#pragma once

/* Network Settings */
#define MENU_PORT 8084
#define ELFLDR_PORT 9021

/* Routes */
#define ROUTE_INDEX "/"
#define ROUTE_INDEX_HTML "/index.html"
#define ROUTE_LIST_PAYLOADS "/list_payloads"
#define ROUTE_UPLOAD "/manage:upload"
#define ROUTE_DELETE "/manage:delete"
#define ROUTE_LOAD_PAYLOAD "/loadpayload:"
#define ROUTE_SHUTDOWN "/shutdown"
#define ROUTE_LOG "/log"
#define ROUTE_VERSION "/version"
#define ROUTE_GETIP "/getip"
#define ROUTE_GET_CONFIG "/get_config"
#define ROUTE_SET_CONFIG "/set_config"
#define ROUTE_ABORT "/abort"
#define ROUTE_AUTOLOAD_STATUS "/autoload_status"
#define ROUTE_AUTOLOAD_CLEAR "/autoload_clear"
#define ROUTE_REPO_LIST "/repository_payloads"
#define ROUTE_REPO_REFRESH "/repository_refresh"
#define ROUTE_REPO_INSTALL "/repository_install"
#define ROUTE_REPO_PUSH "/repository_push"
#define ROUTE_REPO_INSTALL_PUSH "/repository_install_push"

#define MENU_VERSION "1.0.0"
#define AUTOLOAD_CONFIG_PATH "/data/next_menu/autoload.txt"
#define NEXT_CONFIG_PATH "/data/next_menu/next_config.txt"
#define REPOSITORY_CACHE_PATH "/data/next_menu/repository_cache.json"
#define PAYLOADS_STORAGE_DIR "/data/next_menu/payloads"
#define REPOSITORY_SOURCE_URL                                                  \
  "https://itsplk.github.io/ps5_payloads/ps5_payloads.json"
#define REPOSITORY_REFRESH_INTERVAL_SEC 86400

/* Logging */
void nm_log(const char *fmt, ...);
int nm_server_is_active();

#include "autoload.h"
#include "notification.h"
#include "utils.h"

/* Paths */
#define BASE_DATA_DIR "/data/next_menu"

/* Scan Locations (Internal + 8 USB ports) */
static const char *SCAN_DIRS[] = {
    "/data/next_menu",     "/mnt/usb0/next_menu", "/mnt/usb1/next_menu",
    "/mnt/usb2/next_menu", "/mnt/usb3/next_menu", "/mnt/usb4/next_menu",
    "/mnt/usb5/next_menu", "/mnt/usb6/next_menu", "/mnt/usb7/next_menu"};
#define SCAN_DIRS_COUNT 9

/* Messages */
#define MSG_OK "OK"
