import express, { Request, Response } from 'express';
require('dotenv').config();
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles, validURL, uploadToS3, downloadFromS3} from './util/util';
import { getPutSignedUrl } from './aws';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());


  // sample route to test that server is working
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );

  app.get( "/filteredimage/:file_name", async (req: Request, res: Response) => {
    const {file_name} = req.params;
    try {
      if(!file_name) {
        return res.status(400).send('File name is required to download image')
      }
      const response = await downloadFromS3(file_name)
  
      res.send(response)
    } catch (error) {
      res.send(error)
    }
    
  })
  
  // route to get image from public url, filter it, save to disk, then erase from disk.
  // get /filteredimage?image_url={{URL}}
  app.get("/filteredimage", async (req: Request, res: Response) => {
    const image_url  = req.query.image_url as string;

    if (!image_url) {
      return res.status(400).send('request must have contain a query string ?image_url={{URL}}')
    }
    const isValidUrl: boolean = validURL(image_url)
    if(!isValidUrl) {
      return res.status(400).send('Invalid Url')
    }
    try {
      const filteredPath = await filterImageFromURL(image_url)
      deleteLocalFiles([filteredPath])
      res.status(200).send(filteredPath)
    } catch (error) {
      res.status(500).send({error, message: 'There was a problem filtering or saving your file. Make sure the url provided is valid.'})
    }
  })
  //route to filter 
  app.post("/filteredimage/upload", async (req: Request, res: Response) => {
    const image_url  = req.query.image_url as string;
    const { filter } = req.body

    if (!image_url) {
      return res.status(400).send('request must have contain a query string ?image_url={{URL}}')
    }
    const isValidUrl: boolean = validURL(image_url)
    if(!isValidUrl) {
      return res.status(400).send('Invalid Url')
    }
    try {
      const filteredPath = await filterImageFromURL(image_url, filter)
      const fileName = filteredPath.slice(filteredPath.lastIndexOf('/') + 1)
      const response = await uploadToS3(fileName)
      // deleteLocalFiles([filteredPath])
      res.status(200).send(response)
    } catch (error) {
      res.status(500).send({error, message: 'There was a problem filtering or saving your file. Make sure the url provided is valid.'})
    }
  })

  app.get('/signed-url/:fileName', 
    async (req: Request, res: Response) => {
    let { fileName } = req.params;
    const url = getPutSignedUrl(fileName);
    res.status(201).send({url: url});
  });

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );

})();