-- luacheck-Konfiguration für die Lua-Teile des Web-Client-Prototyps
std = "luajit"
max_line_length = 120
-- Deutsche Umlaute in Kommentaren und Texten sind erlaubt.
unused_args = false

files["mods"] = {
	read_globals = {
		"core", "ItemStack", "bit", "vector", "dump",
	},
}

files["tests"] = {
	globals = {"bit"},
}
