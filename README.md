# mixer.haicat.moe
A peer-to-peer sound mixing board that runs (almost\*) entirely in the browser. Intended usage is for online tabletop (e.g. D&D and Pathfinder) sessions in which the DM wants to create soundscapes for their players. This can be downloaded and run as-is (although join links will not work; joining will have to be done via ID). Alternatively, you can use the hosted version [here](https://mixer.haicat.moe).

\* A server is used to broker connections between users. By default, this uses [the PeerJS official PeerServer](https://peerjs.com/peerserver.html)

## Usage
One user hosts a session, and other users can connect. Once connected, the host can add sounds (e.g. from a YouTube video link), and the connected users will hear the sounds as well. Multiple sounds can be added with their own volume controls.

## Current Features
* Adding sounds via Youtube or direct links to sound files
* Volume mixing
* Peer-to-peer connection (via [PeerJS](https://peerjs.com/))
* Easy joining via generated link
* Renamable tracks for organization
* Synchronization
* Cool backgrounds B)

## Planned Features
In order of priority:
* Pause/Play
* Seeking
* Oneshot soundboard for non-looping SFX
* Playlist feature for music
* Saving and loading preset soundscapes
* Default presets (with quick links to load them)
