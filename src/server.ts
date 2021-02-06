import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import {
  filterImageFromURL,
  deleteLocalFiles,
  validURL,
  uploadToS3,
  downloadFromS3
} from './util/util';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

  /**************************************************************************** */

  //! END @TODO1
  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );


  //route to get a specific image from s3 bucket
  app.get( "/filteredimage/:file_name", async (req: Request, res: Response) => {
    const { file_name } = req.params;
    try {
      if(!file_name) {
        return res.status(400).send('File name is required to download image')
      }
      const response:string = await downloadFromS3(file_name)
  
      res.status(200).send(response)
    } catch (error) {
      res.status(400).send(error)
    }
  })

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
      res.status(500).send({error, message: 'There was a problem filtering or saving your file. Make sure the image url provided is valid.'})
    }
  })

  //route to optionally filter image and then upload to S3 bucket
  //optional body param {filter: filter_type}
  //  fiter_type - 'greyscale' | 'sepia'  no filter if not added
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
      deleteLocalFiles([filteredPath])
      res.status(200).send(response)
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