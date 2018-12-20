## yeah so this is a thing
I realize I just kinda needlessly reimplemented the sharding functionality that discord.js already has,
but I certainly learned some neat stuff with this. Containers seem super useful now that I reasonably understand them.

## Running this on your own machine
```
git clone https://github.com/by77er/sharded_discord_docker_bot
cd sharded_discord_docker_bot
```
replace `token_goes_here` in the `Dockerfile` with your own token
```
docker build -t shardedcord .
docker run -d shardedcord
```
