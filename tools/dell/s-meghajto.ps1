# D-F39 (2026-09-13): a Dellen (T2) az S: meghajtó = a NAS-on lévő SynologyDrive/SaaS mappa (Vilmos home-ja, amit a gépe és a Gigabyte tükröz).
# Bejelentkezéskor fut (ütemezett feladat: SaaS-S-meghajto), mert a Windows hitelesítő-tárolója ebből a munkamenetből nem írható
# ("Credentials cannot be saved from this logon session"), így a tartós leképezés magától nem kapcsolódna vissza.
# A belépő a vaultból (a repó vault/ mappája — soha nem kerül a tárhelyre); a jelszó sora vezető szóközzel áll a fájlban → Trim().
# A NAS LAN-címe külön néven (nas-saas, hosts fájl), mert a gépen a másik projekt robotja (dellbot) már SMB-ülést tart a 192.168.1.144 néven,
# és a Windows egy kiszolgálónévhez egy belépőt enged.
$ErrorActionPreference = "Stop"
$vault = Join-Path $PSScriptRoot "..\..\vault\nas-belepes.txt"
$sorok = Get-Content $vault -Encoding UTF8
$u = ($sorok | Where-Object { $_ -like "felhasznalo:*" } | Select-Object -First 1).Substring(12).Trim()
$p = ($sorok | Where-Object { $_ -like "jelszo:*" } | Select-Object -First 1).Substring(7).Trim()
$cel = "\\nas-saas\home\Katinka\SaaS"
$hosts = "C:\Windows\System32\drivers\etc\hosts"
if (-not (Select-String -Path $hosts -Pattern "^\s*192\.168\.1\.144\s+nas-saas(\s|$)" -Quiet)) {
  try { Add-Content -Path $hosts -Value "192.168.1.144 nas-saas   # SaaS: a NAS LAN-cime kulon neven (D-F39)" -Encoding ASCII } catch { Write-Output "hosts: nincs jog - a nas-saas nev hianyzik" }
}
$meglevo = Get-SmbMapping -LocalPath "S:" -ErrorAction SilentlyContinue
if ($meglevo -and $meglevo.Status -eq "OK" -and $meglevo.RemotePath -eq $cel) { Write-Output "S: mar el ($cel)"; exit 0 }
if ($meglevo) { Remove-SmbMapping -LocalPath "S:" -Force -ErrorAction SilentlyContinue }
New-SmbMapping -LocalPath "S:" -RemotePath $cel -UserName $u -Password $p -Persistent $false | Out-Null
Write-Output ("S: -> " + $cel + "  " + (Get-SmbMapping -LocalPath "S:").Status)
