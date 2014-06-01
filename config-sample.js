
var config = {
  blog_domain: "YOUR-BLOG-URL",
  pagesDir: [__dirname,'pages'].join('/'),
  imagesDir: [__dirname,'images'].join('/'),
  cloudinary : {
    cloud_name: 'YOUR-CLOUDINARY-CLOUD-NAME',
    api_key: 'YOUR-CLOUDINARY-API-KEY', 
    api_secret: 'YOUR-CLOUDINARY-API-SECRET'
  }
}

module.exports = config;