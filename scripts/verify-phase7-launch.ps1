param([Parameter(Mandatory=$true)][string]$Runtime)
# Native executable launch fallback when Node child_process is sandbox-restricted.
# Own disposable loopback cluster only; never accepts credentials or a remote URL.
$ErrorActionPreference='Stop'
$phase7TempRoot=[IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$phase7Data=[IO.Path]::GetFullPath((Join-Path $phase7TempRoot ('tcc-phase7-db-'+[guid]::NewGuid().ToString('N'))))
if (-not $phase7Data.StartsWith($phase7TempRoot,[StringComparison]::OrdinalIgnoreCase) -or -not [IO.Path]::GetFileName($phase7Data).StartsWith('tcc-phase7-db-')) { throw 'Unsafe disposable data path' }
$phase7Bin=Join-Path $Runtime 'node_modules/@embedded-postgres/windows-x64/native/bin'
$phase7Started=$false
$phase7RestrictedExec=$env:PG_RESTRICT_EXEC
$env:PG_RESTRICT_EXEC='1' # This worker already runs in a restricted Windows token.
try {
 & (Join-Path $phase7Bin 'initdb.exe') -D $phase7Data -U postgres --auth=trust --encoding=UTF8 --locale=C --no-sync
 if($LASTEXITCODE -ne 0){throw 'Phase 7 initdb failed'}
 $phase7Server=Start-Process -FilePath (Join-Path $phase7Bin 'postgres.exe') -ArgumentList @('-D',('"'+$phase7Data+'"'),'-h','127.0.0.1','-p','55467','-c','fsync=off','-c','synchronous_commit=off') -WindowStyle Hidden -PassThru -RedirectStandardError (Join-Path $phase7Data 'server.log')
 $phase7Started=$true
 $phase7Ready=$false
 for($phase7Try=0;$phase7Try -lt 100;$phase7Try++){
  $phase7Socket=New-Object Net.Sockets.TcpClient
  try{$phase7Socket.Connect('127.0.0.1',55467);$phase7Ready=$true}catch{}finally{$phase7Socket.Dispose()}
  if($phase7Ready){break}
  if($phase7Server.HasExited){throw 'Disposable postgres exited before ready'}
  Start-Sleep -Milliseconds 100
 }
 if(-not $phase7Ready){throw 'Disposable postgres readiness timed out'}
 node scripts/verify-phase7-db.mjs $Runtime --external-lifecycle $phase7Data
 $phase7Exit=$LASTEXITCODE
} finally {
 if($phase7Started){
  & (Join-Path $phase7Bin 'pg_ctl.exe') -D $phase7Data -m fast -w stop
  if(-not $phase7Server.WaitForExit(10000)){Stop-Process -Id $phase7Server.Id; $phase7Server.WaitForExit()}
  $phase7Server.Dispose()
 }
 # Resolve and verify the precise target again before recursive cleanup.
 $phase7Resolved=[IO.Path]::GetFullPath($phase7Data)
 if(-not $phase7Resolved.StartsWith($phase7TempRoot,[StringComparison]::OrdinalIgnoreCase) -or -not [IO.Path]::GetFileName($phase7Resolved).StartsWith('tcc-phase7-db-')){throw 'Unsafe cleanup path'}
 if(Test-Path -LiteralPath $phase7Resolved){Remove-Item -LiteralPath $phase7Resolved -Recurse -Force}
 $env:PG_RESTRICT_EXEC=$phase7RestrictedExec
}
exit $phase7Exit
