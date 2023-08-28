import { execFile } from "child_process";

const FFMPEG_PATH = 'C:/FFMPEG/ffmpeg';

export async function convertVideo(src: string, resolution: string, out: string): Promise<string> {
    const args = [
        "-i", src, // input video
        "-c:v", "libx264", // copy video with codec h264
        "-s", resolution, // convert resolution
        "-pix_fmt", "yuv420p", // pixel color format
        "-map", "0", // include all streams from the input into the output
        "-crf", "26", // quality, the higher the worse (but better compression), 51 max
        out // output file
    ]

    return new Promise((resolve, reject) => {
        execFile(FFMPEG_PATH, args, (error: any, stdout: any, stderr: any) => {
            if (error) {
                console.log("error occured")
                reject(error)
            }

            resolve(stderr)
        })
    })
}

export async function generateSnapshots(src: string, out: string) {
    const args = [
        "-i", src,
        "-vf", "fps=1/30",   // Extracts an image every 15 secs  
        out,
    ];

    return new Promise((resolve, reject) => {
        execFile(FFMPEG_PATH, args, (error: any, stdout: any, stderr: any) => {
            if (error) {
                console.log("error occured")
                reject(error)
            }

            resolve(stderr)
        })
    })
}


export const RESOLUTIONS = [
    { size: "720p", dimensions: "1280x720" },
    { size: "360p", dimensions: "640x360" },
    { size: "144p", dimensions: "256x144" }
]

// const sourceDir = 'D:/Javascript Projects/Audio_streaming/uploads/øneheart x reidenshi - snowfall.mp4';
// // const outDir = 'D:/Javascript Projects/Audio_streaming/Thumbnails/MyFile.mp4'
// // convertVideo(sourceDir, RESOLUTIONS[2].dimensions, outDir);
// generateSnapshots(sourceDir);