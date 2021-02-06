import fs from 'fs';
import Jimp = require('jimp');
import axios, { AxiosRequestConfig } from 'axios';
import { getGetSignedUrl, getPutSignedUrl } from '../aws';
const os = require('os');
const path = require('path');
const readFile = require('util').promisify(fs.readFile)

// filterImageFromURL
// helper function to download, filter, and save the filtered image locally
// returns the absolute path to the local image
// INPUTS
//    inputURL: string - a publicly accessible url to an image file
//    filter: string(optional) "greyscale" or "sepia" defaults to greyscale
// RETURNS
//    an absolute path to a filtered image locally saved file
export async function filterImageFromURL(inputURL: string, filter = 'greyscale'): Promise<string>{
    return new Promise( async (resolve, reject) => {
        try {
            const photo = await Jimp.read(inputURL);
            const outpath = '/tmp/filtered.'+Math.floor(Math.random() * 2000)+'.jpg';
            photo
            .resize(256, 256) // resize
            .quality(60) // set JPEG quality
            
            //handle optional filters
            if(filter) {
                filter === 'sepia' && await photo.sepia();
                filter === 'greyscale' && photo.greyscale();
            } else {
                
            }
            photo.write(__dirname+outpath, (img)=>{
                resolve(__dirname+outpath);
            }); 
        } catch (error) {
            reject(error)
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

 //uploadToS3
 //Helper function to upload local file to S3 bukcet,
 // @Params: 
 //     fileName -string  name of local file
 //     path -string path to local file

 export async function uploadToS3 (fileName: string) {
     return new Promise(async (resolve, reject) => {
        try {
            const preSignedPutUrl: string = getPutSignedUrl(fileName);
            const _path = path.resolve(__dirname, 'tmp', fileName)
            const file = await readFile(_path)
            const config: AxiosRequestConfig = {
                method: 'put',
                url: preSignedPutUrl,
                headers: {
                    'Content-Type': 'image/jpeg'
                },
                data: file,
            }
            await axios(config)
            resolve(`Successfully uploaded ${fileName} to S3 Bucket`)
        } catch (error) {
            reject(error)
        }
     })  
 }
 //downloadFromS3
 //helper function to download a jpeg image from S3 bucket and save it to the desktop
 // @Params 
 //     -fileName -string name of the file in the S3 bucket to download
 export async function downloadFromS3 (fileName: string) {
    return new Promise<string>(async (resolve, reject) => {
     try {
        const preSignedGetUrl: string = getGetSignedUrl(fileName);
        const response = await axios.get(preSignedGetUrl, {
            responseType: 'arraybuffer',
        })
        const homePath = os.homedir();
        const _path = path.join(homePath, 'Desktop', fileName)
        
        fs.writeFileSync(_path, response.data)
        resolve(`Successfully downloaded ${fileName} to the desktop`)

     } catch (error) {
         reject(`There was a problem downloading ${fileName}`)
     }
    })
 }