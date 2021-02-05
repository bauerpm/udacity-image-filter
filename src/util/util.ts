import fs from 'fs';
import Jimp = require('jimp');
import axios, { AxiosResponse } from 'axios';
import { getPutSignedUrl } from '../aws';

const readFile = require('util').promisify(fs.readFile)

// filterImageFromURL
// helper function to download, filter, and save the filtered image locally
// returns the absolute path to the local image
// INPUTS
//    inputURL: string - a publicly accessible url to an image file
// RETURNS
//    an absolute path to a filtered image locally saved file
export async function filterImageFromURL(inputURL: string): Promise<string>{
    return new Promise( async (resolve, reject) => {
        try {
            const photo = await Jimp.read(inputURL);
            const outpath = '/tmp/filtered.'+Math.floor(Math.random() * 2000)+'.jpg';
            await photo
            .resize(256, 256) // resize
            .quality(60) // set JPEG quality
            .greyscale() // set greyscale
            .write(__dirname+outpath, (img)=>{
                resolve(__dirname+outpath);
            }); 
        } catch (error) {
            reject(error)
        }
    });
}

// filterImageAndSaveS3
// helper function to download, filter, and save image to S3 bucket
export async function filterImageAndSaveS3 (imageUrl: string) : Promise<string> {
    return new Promise (async (resolve, reject) => {
        try {
            const photo: Jimp = await Jimp.read(imageUrl);

        } catch (error) {

        }
    });
}

// deleteLocalFiles
// helper function to delete files on the local disk
// useful to cleanup after tasks
// INPUTS
//    files: Array<string> an array of absolute paths to files
export async function deleteLocalFiles(files:Array<string>){
    for( let file of files) {
        fs.unlinkSync(file);
    }
}

export function validURL(myURL: string) {
    var pattern: RegExp = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ //port
    '(\\?[;&amp;a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i');
    return pattern.test(myURL);
 }

 export async function uploadToS3 (fileName: string, path: string) {
     return new Promise<AxiosResponse>(async (resolve, reject) => {
        try {
            const preSignedPutUrl: string = getPutSignedUrl(fileName);
            const file = await readFile(path)
            const response: AxiosResponse = await axios.put(preSignedPutUrl, {
                data:file
            },  {
                headers: {
                  'Content-Type': 'application/octet-stream'
                }
            });
            resolve(response)
         } catch (error) {
            reject(error)
         }
     })  
 }