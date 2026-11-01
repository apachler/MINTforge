# Patches für minetest-wasm

`wasm/build.sh` wendet diese Patches nach dem Klonen auf den gepinnten Commit an. Jeder Patch ist klein und hier
begründet; wenn möglich wird er beim Autor eingereicht und fällt dann weg.

| Patch | Warum |
|---|---|
| `0001-zstd-nur-statisch.patch` | zstd (Commit `f8745da`) baut mit CMake standardmäßig auch `libzstd.so`. libarchive linkt dann `-lzstd` dynamisch, und das Testprogramm von `configure` bricht ab (`ENOENT … libzstd.so`, „cannot compute sizeof (wchar_t)“). Belegt im CI-Lauf vom 01.11.2026. `-DZSTD_BUILD_SHARED=OFF` baut nur die statische Bibliothek. |
| `0002-libzip-nur-statisch.patch` | Gleiche Ursache bei libzip 1.11.4 (`option(BUILD_SHARED_LIBS … ON)`): Der Shared-Link von `libzip.so` scheitert an der nicht-PIC-`libz.a` von Emscripten (`relocation R_WASM_MEMORY_ADDR_LEB … recompile with -fPIC`). Belegt im CI-Lauf vom 01.11.2026. `-DBUILD_SHARED_LIBS=OFF` baut nur statisch; `build_luanti.sh` linkt ohnehin `libzip.a`. |
