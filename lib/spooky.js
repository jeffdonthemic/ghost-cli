var program = require('commander'),
  _ = require("lodash"),
  Q = require("q"),
  moment = require('moment'),
  request = require('request'),
  cloudinary = require('cloudinary'),
  fs = require('graceful-fs'),
  replace = require('replace'),
  config = require('../config'),
  glob = require('glob');

exports.blogstats = function() {

  fs.readFile('GhostData.json', 'utf8', function (err,data) {
    if (err) { return console.log(err); }
    if (!err) {
      var results = JSON.parse(data);
      results = results.db[0];
      var permalinks = _.find(results.data.settings, function(s) { return s.key === 'permalinks'; });   
      var theme = _.find(results.data.settings, function(s) { return s.key === 'activeTheme'; });       
      var tags = _.map(results.data.tags, function(item) { return item.name; });   
      var users = _.map(results.data.users, function(user) { return user.name; });         
      var posts = _.filter(results.data.posts, function(item) { return item.page == 0; });
      var pages = _.filter(results.data.posts, function(item) { return item.page == 1; });
      // output the stats
      console.log('Blog stats:');
      console.log("Posts: " + posts.length); 
      console.log("Static Pages: " + pages.length); 
      console.log("Users: (" + users.length + ") " + users.join(", "));
      console.log("Tags: (" + tags.length + ") " + tags.join(", "));
      console.log("Theme: " + theme.value)
    }
  });   

}

exports.poststats = function(id) {

  id = parseInt(id);
  fs.readFile('GhostData.json', 'utf8', function (err,data) {
    if (err) { return console.log(err); }
    if (!err) {
      var results = JSON.parse(data);
      results = results.db[0];
      var post = _.find(results.data.posts, function(p) { return p.id === id; });   

      post.author = _.find(results.data.users, function(u) { return u.id === post.author_id; }).name;
      post.created_by =  _.find(results.data.users, function(u) { return u.id === post.created_by; }).name;
      post.updated_by =  _.find(results.data.users, function(u) { return u.id === post.updated_by; }).name;
      post.published_by =  _.find(results.data.users, function(u) { return u.id === post.published_by; }).name;

      // make some asthetic mods
      post.static_page = 'no';
      post.featured = 'no';
      if (post.page === 1) post.static_page = 'yes';
      if (post.featured === 1) post.featured = 'yes';      

      // find the tags for the post
      var tags = _.filter(results.data.posts_tags, function(s) { 
        return s.post_id === id;
      }); 
      // get all of matching tag ids
      var tag_ids = _.pluck(tags, 'tag_id');      
      var matching_tags = _.filter(results.data.tags, function(s) { 
        return _.contains(tag_ids, s.id); 
      });           
      post['tags'] = _.pluck(matching_tags, 'name').join(', ');

      // remove some properties
      delete post['markdown'];
      delete post['html'];
      delete post['page'];
      delete post['author_id'];

      _(_.keys(post)).forEach(function(key) {
        console.log(key + ": " + post[key]);
      });
    }
  });   

}

exports.replace = function(target, replacement, file) {

    replace({
      regex: target,
      replacement: replacement,
      paths: [[config.pagesDir,file+'.md'].join("/")],
      recursive: true,
      silent: false,
    });      
  
}

exports.find = function(target) {

  fs.readdir(config.pagesDir, function(err, files) {
    if (err) { console.log(err); }
    if (!err) {
      console.log("Found '" + target + "' in the following pages:")
      _(files).forEach(function(file) {
        fs.readFile([config.pagesDir, file].join("/"), function (err,data) {
          if (err) { console.log('Error reading ' + file); }
          if (!err) {
            if (data.toString().search(target) >= 0) { 
              console.log(file);
            }
          }
        });           
      });
    }
  }); 

}

exports.findtag = function(tag) {

  fs.readFile('GhostData.json', 'utf8', function (err,data) {
    if (err) { return console.log(err); }
    if (!err) {
      var results = JSON.parse(data);
      results = results.db[0];
      // find the id of the tag
      var t = _.find(results.data.tags, function(s) { 
        return s.name.toLowerCase() === tag.toLowerCase(); 
      });

      if (t) {
        // find all of the posts containing this tag
        var posts = _.filter(results.data.posts_tags, function(s) { 
          return s.tag_id === t.id; 
        });        
        // pluck the post_ids
        var post_ids = _.pluck(posts, 'post_id');
        // find all of the posts by id
        var containing = _.filter(results.data.posts, function(s) { 
          return _.contains(post_ids, s.id); 
        });     
        console.log("Found the following post(s) with the tag '"+tag +"'");
        _(containing).forEach(function(post) {
          console.log(post.slug + " (" + post.id + ")");
        });  
      } else {
        console.log("Tag '"+tag +"' not found.");
      }
    }
  });   

}

exports.dir2cloudinary = function() {

  fs.readdir(config.imagesDir, function(err, files) {
    _(files).forEach(function(file) {
      cloudinary.uploader.upload([config.imagesDir,file].join('/'), function(result) { 
        console.log(result) 
      });      
    });
  });

}

exports.url2cloudinary = function(url) {

  cloudinary.uploader.upload(url, function(result) { 
    console.log(result) 
  });

}

exports.findinwayback = function(url) {

  console.log('Searching Wayback Machine.....');
  var archiveUrl = "http://archive.org/wayback/available?url=";
  request(archiveUrl + url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(JSON.parse(body)) ;
    } else {
      console.log("Error calling Wayback Machine!");
    }
  }); 

}

exports.dump = function() {

  fs.mkdir("pages", function() {
    fs.readFile('GhostData.json', 'utf8', function (err,data) {
      if (err) { return console.log(err); }
      if (!err) {
        var results = JSON.parse(data);
        results = results.db[0];
        var contents = '';
        console.log("Saving the following pages to " + config.pagesDir + ":")
        _(results.data.posts).reverse().forEach(function(item) {
          fs.writeFile('pages/' + item.id + '.md', item.markdown, function (err) {
            if (err) throw err;
            console.log(item.slug + " (" + item.id + ".md)");
          });  
        });      
      }
    });   
  });

}

exports.toc = function() {

  fs.readFile('GhostData.json', 'utf8', function (err,data) {
    if (err) { return console.log(err); }
    if (!err) {

      var results = JSON.parse(data);
      results = results.db[0];
      // determine if they are using dates in permelinks
      var permalinks = _.find(results.data.settings, function(s) { return s.key === 'permalinks'; });
      var contents = '';
      _(results.data.posts).reverse().forEach(function(item) {
        // only posts
        if (item.page === 0) {
          var day = moment(item.published_at).format('DD');
          var month = moment(item.published_at).format('MM');
          var year = moment(item.published_at).format('YYYY');
          var post = "[" + item.title + "](" + config.blog_domain + "/";
          if (permalinks.value === '/:slug/')
            post += item.slug + ")\n\n";
          else
            post += year + "/" + month + "/" + day + "/" + item.slug + ")\n\n";
          contents += post;
        }
      });

      fs.writeFile([config.pagesDir, 'toc.md'].join('/'), contents, function (err) {
        if (err) throw err;
        console.log('TOC page saved to ' + config.pagesDir + '/toc.md.');
      });        

    }
  });     

}

exports.check404s = function() {

  var urls = [];
  fs.readFile('GhostData.json', 'utf8', function (err,data) {
    if (err) { return console.log(err); }
    if (!err) {
      var results = JSON.parse(data);
      results = results.db[0];
      var permalinks = _.find(results.data.settings, function(s) { return s.key === 'permalinks'; });
      _(results.data.posts).reverse().forEach(function(item) {
        var day = moment(item.published_at).format('DD');
        var month = moment(item.published_at).format('MM');
        var year = moment(item.published_at).format('YYYY');
        var url = config.blog_domain + "/";
        if (permalinks.value === '/:slug/')
          url += item.slug;
        else
           url += year + "/" + month + "/" + day + "/" + item.slug;
        if (item.status === 'published' && item.page === 0) 
          urls.push({'id': item.id, 'url': url});
      }); 
      checkUrls(urls);
    }
  });

  var checkUrls = function (posts) {
    for (var i = 0; i < posts.length ; i++) {
      checkUrlStatus(posts[i]).then(function(resp) {
        if (resp.indexOf("404") > -1)
          console.log("404!! ****** " + resp + " ******");
        else
          console.log(resp);
      });results = results.db[0];
    }
  };  

  var checkUrlStatus = function (post) {
    var deferred = Q.defer();
    request(post.url, function (error, response, body) {
      deferred.resolve(post.url + " (" + post.id  + ") - " + response.statusCode);
    });
    return deferred.promise
  };  

}

exports.checkcloud = function() {

    listAllPosts().then(function(files) {
        files.forEach(function(file) {
            findImageInFile(file).then(function(urlsFound) {
                console.log(file +": " + urlsFound.length);
            });
        });    
    });

    function listAllPosts() {
      var deferred = Q.defer();
      glob(config.pagesDir + '/*', function(err, files) {
          deferred.resolve(files);
      });
      return deferred.promise
    }

    function findImageInFile(file) {
      var deferred = Q.defer();
      fs.readFile(file, function (err,data) {
        var targetUrl = '(/content/images/';
        if (err) { if (err) deferred.reject(err); }
        if (!err) {
          var md = data.toString();
          var globalStart = 0;
          var finished = false;
          var occurrences = [];
          while (!finished) {
            if (md.indexOf(targetUrl, globalStart) != -1) {
              var start = md.indexOf(targetUrl, globalStart);
              // find the closing "
              var end = md.indexOf(')', start);
              occurrences.push(md.substring(start+1, end));
              globalStart = end;
            } else {
              finished = true;
            } 

          }
          if (occurrences.length > 0) {
              deferred.resolve(occurrences);
          } else {
              deferred.reject('No images found in ' + file);
          }
        }
      });
      return deferred.promise
  }         
}

exports.cloudit = function(file) {
  findImageInFile([config.pagesDir, file].join("/"))
    .then(function(originalUrls) {
      originalUrls.forEach(function(originalUrl) {
          uploadToCloudinary(config.blog_domain + '/' + originalUrl)
          .then(function(cloudinaryUrl) {
              replaceTextInFiles(originalUrl, cloudinaryUrl)
          })
          .fail(function (error) {
            console.log(error);
          });    
        })
    })
    .fail(function (error) {
      console.log(error);
    });    

  function findImageInFile(file) {
      var deferred = Q.defer();
      fs.readFile(file, function (err,data) {
        var targetUrl = '(/content/images/';
        if (err) { if (err) deferred.reject(err); }
        if (!err) {
          var md = data.toString();
          var globalStart = 0;
          var finished = false;
          var occurrences = [];
          while (!finished) {
            if (md.indexOf(targetUrl, globalStart) != -1) {
              var start = md.indexOf(targetUrl, globalStart);
              // find the closing "
              var end = md.indexOf(')', start);
              occurrences.push(md.substring(start+1, end));
              globalStart = end;
            } else {
              finished = true;
            } 

          }
          if (occurrences.length > 0) {
              deferred.resolve(occurrences);
          } else {
              deferred.reject('No images found in ' + file);
          }
        }
      });
      return deferred.promise
  }                  


  function replaceTextInFiles(target, replacement) {
    console.log("Replacing...");
    replace({
      regex: target,
      replacement: replacement,
      paths: [config.pagesDir],
      recursive: true,
      silent: false,
    });      
  }  

  function uploadToCloudinary(url) {
      console.log('Uploading to Cloudinary: ' + url);
      var deferred = Q.defer();
      cloudinary.uploader.upload(url, function(result) { 
        console.log("Cloudinary URL: " + result.url);
        deferred.resolve(result.url) ;
      });     
      return deferred.promise
  } 

}
    