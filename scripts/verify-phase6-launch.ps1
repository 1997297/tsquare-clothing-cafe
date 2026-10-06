param([Parameter(Mandatory=$true)][string]$Runtime)
# Native executable launch fallback when Node child_process is sandbox-restricted.
# Own disposable loopback cluster only; never accepts credentials or a remote URL.
$ErrorActionPreference='Stop'
$phase6TempRoot=[IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$phase6Data=[IO.Path]::GetFullPath((Join-Path $phase6TempRoot ('tcc-phase6-db-'+[guid]::NewGuid().ToString('N'))))
if (-not $phase6Data.StartsWith($phase6TempRoot,[StringComparison]::OrdinalIgnoreCase) -or -not [IO.Path]::GetFileName($phase6Data).StartsWith('tcc-phase6-db-')) { throw 'Unsafe disposable data path' }
$phase6Bin=Join-Path $Runtime 'node_modules/@embedded-postgres/windows-x64/native/bin'
$phase6Started=$false
$phase6RestrictedExec=$env:PG_RESTRICT_EXEC
$env:PG_RESTRICT_EXEC='1' # This worker already runs in a restricted Windows token.
try {
 & (Join-Path $phase6Bin 'initdb.exe') -D $phase6Data -U postgres --auth=trust --encoding=UTF8 --locale=C --no-sync
 if($LASTEXITCODE -ne 0){throw 'Phase 6 initdb failed'}
 $phase6Server=Start-Process -FilePath (Join-Path $phase6Bin 'postgres.exe') -ArgumentList @('-D',('"'+$phase6Data+'"'),'-h','127.0.0.1','-p','55466','-c','fsync=off','-c','synchronous_commit=off') -WindowStyle Hidden -PassThru -RedirectStandardError (Join-Path $phase6Data 'server.log')
 $phase6Started=$true
 $phase6Ready=$false
 for($phase6Try=0;$phase6Try -lt 100;$phase6Try++){
  $phase6Socket=New-Object Net.Sockets.TcpClient
  try{$phase6Socket.Connect('127.0.0.1',55466);$phase6Ready=$true}catch{}finally{$phase6Socket.Dispose()}
  if($phase6Ready){break}
  if($phase6Server.HasExited){throw 'Disposable postgres exited before ready'}
  Start-Sleep -Milliseconds 100
 }
 if(-not $phase6Ready){throw 'Disposable postgres readiness timed out'}
 node scripts/verify-phase6-db.mjs $Runtime --external-lifecycle $phase6Data
 $phase6Exit=$LASTEXITCODE
} finally {
 if($phase6Started){
  & (Join-Path $phase6Bin 'pg_ctl.exe') -D $phase6Data -m fast -w stop
  if(-not $phase6Server.WaitForExit(10000)){Stop-Process -Id $phase6Server.Id; $phase6Server.WaitForExit()}
  $phase6Server.Dispose()
 }
 # Resolve and verify the precise target again before recursive cleanup.
 $phase6Resolved=[IO.Path]::GetFullPath($phase6Data)
 if(-not $phase6Resolved.StartsWith($phase6TempRoot,[StringComparison]::OrdinalIgnoreCase) -or -not [IO.Path]::GetFileName($phase6Resolved).StartsWith('tcc-phase6-db-')){throw 'Unsafe cleanup path'}
 if(Test-Path -LiteralPath $phase6Resolved){Remove-Item -LiteralPath $phase6Resolved -Recurse -Force}
 $env:PG_RESTRICT_EXEC=$phase6RestrictedExec
}
exit $phase6Exit
