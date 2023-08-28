export type info = {
    host: {
        id: string
        name: string
    },
    users: Array<{ id: string, name: string }>,
    currentPlayTime: number,
    isPlaying: boolean,
    isPaused: boolean,
    isSeeking: boolean,
    toUpdateflag: boolean,
    videoName: string
    hasUploaded: boolean

};

export const myRooms = new Map<string, info>();

