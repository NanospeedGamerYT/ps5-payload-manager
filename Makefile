# Next Menu - Native PS5 ELF Daemon Makefile

# Tools
PYTHON := python3
CC     := /opt/ps5-payload-sdk/bin/prospero-clang

# Paths
SDK      := /opt/ps5-payload-sdk
TARGET   := $(SDK)/target
INCLUDES := -Iinclude -I$(TARGET)/include
LIBS     := -L$(TARGET)/lib -lmicrohttpd -lpthread -lSceNetCtl -lSceUserService -lSceSystemService -lSceAppInstUtil

# Source Files
SRCS := src/main.c src/payload_mgr.c src/ps5_launcher.c src/notification.c src/utils.c src/autoload.c src/app_installer.c
OBJS := $(SRCS:.c=.o)
ELF  := next_menu.elf

# Assets
FRONTEND_DIST := frontend/dist/index.html
ASSET_HEADER  := include/assets_index_html.h

# Compiler Flags
CFLAGS := -g -O2 -Wall $(INCLUDES)

all: $(ELF)

# Build the React frontend
.PHONY: frontend-build
frontend-build:
	@echo "Building frontend..."
	cd frontend && npm install && npm run build
	@VERSION=$$(grep '#define MENU_VERSION' include/next_menu.h | awk '{print $$3}' | tr -d '"'); \
	COMMIT=$$(git rev-parse --short HEAD 2>/dev/null || echo "unknown"); \
	git diff --quiet || COMMIT="DEV"; \
	DATE=$$(date -u +"%Y-%m-%d %H:%M UTC"); \
	TITLE="Next Menu v$$VERSION ($$COMMIT, built at $$DATE)"; \
	echo "Updating title in index.html to: $$TITLE"; \
	sed -i '' "s/\[\[TITLE_PLACEHOLDER\]\]/$$TITLE/g" frontend/dist/index.html

$(ASSET_HEADER): $(FRONTEND_DIST)
	@echo "Generating asset header..."
	$(PYTHON) tools/gen_assets.py $(FRONTEND_DIST) $(ASSET_HEADER) index_html

$(FRONTEND_DIST):
	@echo "ERROR: frontend/dist/index.html not found!"
	@echo "Please run 'make frontend-build' locally on your host machine first."
	@exit 1

$(ELF): $(ASSET_HEADER) $(SRCS)
	@echo "Building $(ELF)..."
	$(CC) $(CFLAGS) -o $(ELF) $(SRCS) $(LIBS)

clean:
	rm -f $(ELF) $(ASSET_HEADER) src/*.o

dist-clean: clean
	rm -rf frontend/dist

.PHONY: all clean frontend-build dist-clean
