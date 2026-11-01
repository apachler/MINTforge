-- Anmeldung mit kurzlebigem Token statt Passwort (Prototyp)
--
-- Luanti meldet mit SRP an. Wenn diese Mod für einen Namen ein Passwort-Hash liefert, muss der Client genau
-- das passende Passwort mitschicken. Wir liefern den Hash des Tokens aus dem aktuellen Zeitfenster
-- (siehe token.lua). Eine freie Registrierung gibt es dadurch nicht: Jeder gültige Name hat schon ein
-- „Konto“, und ohne Token kommt niemand hinein.
--
-- Gespeichert werden nur Pseudonym, Rechte und Zeitpunkt der letzten Anmeldung (Mod-Speicher).

local token = ...

return function(einstellungen, speicher, schluessel)
	local function sha256_raw(daten)
		return core.sha256(daten, true)
	end

	local function rechte_laden(name)
		local roh = speicher:get_string("rechte:" .. name)
		if roh ~= "" then
			return core.string_to_privs(roh)
		end
		local rechte = core.string_to_privs(core.settings:get("default_privs") or "interact, shout")
		if einstellungen.lehrkraefte[name] then
			rechte.mintforge_lehrkraft = true
		end
		return rechte
	end

	local handler = {}

	function handler.get_auth(name)
		assert(type(name) == "string")
		if not token.name_gueltig(name) then
			return nil
		end
		local fenster = token.zeitfenster(os.time(), einstellungen.token_fenster)
		local passwort = token.passwort(sha256_raw, schluessel, name, fenster)
		local rechte = rechte_laden(name)
		if name == core.settings:get("name") then
			for recht, def in pairs(core.registered_privileges) do
				if def.give_to_admin then
					rechte[recht] = true
				end
			end
		end
		local letzte = speicher:get_int("zuletzt:" .. name)
		return {
			password = core.get_password_hash(name, passwort),
			privileges = rechte,
			last_login = letzte ~= 0 and letzte or -1,
		}
	end

	-- Wird nicht erreicht, weil get_auth für jeden gültigen Namen schon ein Konto liefert.
	function handler.create_auth()
		return nil
	end

	function handler.delete_auth(name)
		speicher:set_string("rechte:" .. name, "")
		speicher:set_string("zuletzt:" .. name, "")
		return true
	end

	-- Passwörter gibt es nicht; /setpassword und Ähnliches bleiben wirkungslos.
	function handler.set_password()
		return false
	end

	function handler.set_privileges(name, rechte)
		speicher:set_string("rechte:" .. name, core.privs_to_string(rechte))
		if core.notify_authentication_modified then
			core.notify_authentication_modified(name)
		end
	end

	function handler.reload()
		return true
	end

	function handler.record_login(name)
		speicher:set_int("zuletzt:" .. name, os.time())
	end

	function handler.iterate()
		local namen = {}
		for k in pairs(speicher:to_table().fields) do
			local name = k:match("^rechte:(.+)$") or k:match("^zuletzt:(.+)$")
			if name then
				namen[name] = true
			end
		end
		return pairs(namen)
	end

	core.register_authentication_handler(handler)

	-- Läuft vor der Anmeldung: ungültige Namen gar nicht erst zulassen.
	core.register_on_prejoinplayer(function(name)
		if not token.name_gueltig(name) then
			return "Dieser Name passt nicht. Bitte starte das Labor über den Link aus deiner Lernplattform."
		end
	end)
end
