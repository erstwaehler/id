ich stell mir das so vor das wir sozusagen betterauth als keycloak haben.
um auf live.ewf-stade.de, schedule.*, wahlen.*, umfrage.* etc. zugreifen zu können muss man also sozusagen ein zentrales konto bei ewf-id haben.
die einzigen anmeldemethoden sind die oidcs von den schulen (also athenetz.de und was die anderen so haben).

vorteil hierbei ist dass man für alle teile, die zum beispiel auch verschiedene frameworks nutzen / datenbanken eine zentrale auth-db hat. dort muss ich einfach ein "Sign in with EWF_ID" button einbauen und fertig.
