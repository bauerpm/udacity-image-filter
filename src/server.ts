import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles, validURL} from './util/util';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );
  
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

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );

})();