# Ghost CLI

Since the [Ghost](http://www.ghost.org/) blogging platform does not include a CLI (at this time), I decided to build one containing some simple admin functions. I needed a number of these functions when I ported my blog from WordPress with roughly 500 post to Ghost. I had a number things that needed to be corrected and cleaned up.

The CLI operates from the export of your blog's settings and data. Any changes made using the CLI are not reflected in your blog. You must **manually** update your blog. **Again, no changes are automatically made on your Ghost blog.**

**[This video](https://www.youtube.com/watch?v=LzG_EJ14g3Q) covers installation and an overview of the CLI's functionality.**

# Installation

The CLI uses [Node.js](http://nodejs.org/) so make sure you have it installed and perform the following to get the CLI up and running:

```bash
git clone git@github.com:jeffdonthemic/ghost-cli.git
cd ghost-cli
npm install
```

Rename `config-sample.js` to `config.js` and add your blog's domain (e.g., http://blog.jeffdouglas.com) and Cloudinary Account Details from the [Cloudinary Dashboard](https://cloudinary.com/console) if you want to use the Cloudinary functions. 

You may also have to run `chmod 777 ./bin/ghost` to make the file executable on OS X. 

# Running

Before you can run the CLI you'll need to export and download the data and setting for your blog. The CLI runs against this data. Log into your blog and go to https://YOUR-BLOG.ghost.io/ghost/debug.

Click the blue Export button and save the `GhostData.json` file to the `ghost-cli` root directory.

Now run the following in terminal to write the markdown for each blog post to a separate file in the `/pages` directory. Feel free to perform this any time you wish to update your data and settings locally after you make changes on your actual blog.

```bash
./bin/ghost dump
```

Now you are ready to rock 'n roll! To see what commands are available for the CLI type `./bin/ghost --help`

```
./bin/ghost --help

  Usage: ghost [options] [command]

  Commands:

    blogstats              Displays blog stats.
    poststats <post>       Displays stats for a specific post (e.g., 10)
    find <t>               Finds the target t in all posts and diplays the matching file names.
    findtag <t>            Finds all posts with tag t.
    replace <t> <r> <post> Replaces all instance of t with r in the specified post (e.g., 10).
    404check               Checks each post to make sure it exists actually exists at your blog domain.
    toc                    Build a simple markdown page with links to all posts.
    dir2cloudinary         Uploads all files in the /images directory to Cloudinary.
    url2cloudinary <url>   Upload an image to Cloudinary by URL.
    findinwayback <url>    Finds a URL (i.e., image) in the Internet Archive Wayback Machine.
    waybackit              Looks for an image in a file and tries to locate it in the wayback machine.
    dump                   Writes the markdown for each blog post to a separate file.

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```