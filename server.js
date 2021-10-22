if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
  }
  
  const express = require('express')
  const app = express()
  const bcrypt = require('bcrypt')
  const passport = require('passport')
  const flash = require('express-flash')
  const session = require('express-session')
  const methodOverride = require('method-override')
  const Pool = require('pg').Pool

  
  const initializePassport = require('./passport-config')
  initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
  )
  
  const users = []

 const pool =new Pool({
        user: "vms_prod",
        password: "vms_prod",
        host: "localhost",
        port: "5432",
        database: "volunteermanagement"
  } )

  
  app.set('view-engine', 'ejs')
  app.use(express.urlencoded({ extended: false }))
  app.use(flash())
  app.use(session({
    secret: "cat",
    resave: false,
    saveUninitialized: true,
    unset: 'destroy',
    name: 'session cookie name'
   
  }))
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(methodOverride('_method'))
  
  app.get('/',  (req, res) => {
   
    res.render('main.ejs')
    
  })

  app.post('/',  (req, res) => {
   sess = req.session;
   sess.entitytype = req.body.entitytype;
   console.log("entitytype:"+req.body.entitytype)
   if (req.body.entitytype == 'volunteer')
   { res.render('volunteer-login.ejs') }
   else if (req.body.entitytype == 'nonprofitorg')
   { res.render('nonprofit-org-login.ejs') }

  })
  
  //app.get('/test/event/:event',  (req, res) => {
   app.get('/test',  (req, res) => {

      console.log("event:"+req.query.id)
      res.render('test.ejs');

  });



  app.get('/search-event',  (req, res) => {
  
    //res.render('test1.ejs');
    res.render('search-event.ejs', { model: [] });
  });

  app.post('/search-event',  (req, res) => {
  

    const sql = 'select * from vms."Event" where "nonprofitorgid" = '+
    '(select "Id" from vms."nonprofit_org" where "Orgname"= $1) '+
    'and "Date" between to_date($2,\'MM/DD/YYYY\') and to_date($3,\'MM/DD/YYYY\')';
    const event = [req.body.nonProfitOrgName,req.body.fromDate, req.body.toDate];
    console.log("****SQL"+sql);
    console.log("****fromDate"+req.body.fromDate);
    console.log("****toDate"+req.body.toDate);
    pool.query(sql , event, (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      console.log(result)
      res.render('search-event.ejs', { model: result.rows });
    });
  });

  app.get('/event',  (req, res) => {
    sess = req.session;
    sess.eventId = req.body.eventid;
    //console.log("in event **** nonprofitorg id :" + sess.nonprofitorgid);
      //var nonprofitorgid = sess.nonprofitorgid;
      console.log("event:"+req.query.id)
    const sql = 'select "Name","Address1","Address2","City","Zip","TotalPositions","BeginTime","EndTime","ContactFirstName","ContactLastName","ContactEmailAddress","Description","nonprofitorgid","State","Date" from vms."Event" where "Id" =  $1'
    pool.query(sql , [req.query.id], (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      console.log(result)
      res.render('event.ejs', { model: result.rows });
    });
  });

  app.post('/event',  (req, res) => {
    try {
      console.log("inside event edit***");
      sess = req.session;
      console.log("inside event edit*** Id" + req.body.eventid);
      //sess = req.session;
      console.log("in nonprofitorg id :" + req.body.event);
      const sqlUpdate = 'update vms."Event" set "Name" = $1, "Address1" = $2, "Address2" = $3, "City" = $4, "Zip" = $5, "TotalPositions" = $6,'+
                        '"BeginTime"= $7, "EndTime"=$8, "ContactFirstName"=$9,"ContactLastName"=$10,"ContactEmailAddress"=$11,"Description"=$12 ,"State"=$13 '+
                        'where "Id"= 10 ' 


      const event = [req.body.event,req.body.address1, req.body.address2, req.body.city, req.body.zip, req.body.totalpositions, req.body.begintime, req.body.endtime, req.body.contactfirstname, req.body.contactlastname, req.body.contactemail, req.body.description, req.body.state];
      
      /*const sqlUpdate = 'update vms."Event" set "Name" = $1, "Address1" = $2 where "Id"= 10 ' 


      const event = [req.body.event,req.body.address1]; */
      pool.query(sqlUpdate, event, (err, result) => {
        if (err) {
          return console.error("Error while updating an event - "+ err.message);
        }
        else 
        { //var newlyCreatedUserId = result.rows[0].Id;
          console.log("event id updated : "+sess.eventId)
        }

    });
      res.redirect('/view-events')
    } catch {
      res.redirect('/event')
    }
  })

  app.get('/view-events',  (req, res) => {
    sess = req.session;
    console.log("in view event **** nonprofitorg id :" + sess.nonprofitorgid);
      //var nonprofitorgid = sess.nonprofitorgid;

    const sql = 'select * from vms."Event" where nonprofitorgid = 28 order by "Id"'
    pool.query(sql , [], (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      console.log(result)
      res.render('view-events.ejs', { model: result.rows });
    });
  });
    
  app.get('/volunteer',  (req, res) => {
    if(!req.user) {
      console.log("session"+request.user.id)
      
    }
    console.log("in volunteer email" + sess.email);
    //console.log("inside volunteer"+req.user.name)
    res.render('search-event.ejs',{ model: [] })
  })

  app.get('/nonprofit-org',  (req, res) => {
    console.log("in nonprofitorg email" + sess.email);
    const sqlUserExists = 'SELECT "Orgname" as name , "Id" as id FROM vms."nonprofit_org" where "EmailAddress" = $1'
    pool.query(sqlUserExists , [sess.email], (err, result1) => {
      if (err) {
        return console.error(err.message);
      }
      else
      {if (result1.rows.length>0)
        {
          console.log('email exists:' + result1.rows[0].name);
          sess = req.session;
          sess.name1 =result1.rows[0].name;
          sess.nonprofitorgid=result1.rows[0].id;
          console.log('session name:' + sess.name1);
        }}})

    //console.log("inside volunteer"+req.user.name)
    res.render('nonprofit-org.ejs')
  })

  app.get('/add-event',  (req, res) => {
    console.log("in nonprofitorg " + sess.name1);
    console.log("in nonprofitorg id :" + sess.nonprofitorgid);
    res.render('add-event.ejs')
  })

  app.post('/add-event',  (req, res) => {
    try {
      console.log("inside event post***");
      //sess = req.session;
      console.log("in nonprofitorg id :" + sess.nonprofitorgid);
      var nonprofitorgid = 28;
      const sqlInsert = 'insert into vms."Event" ("Name","Address1","Address2","City","Zip","TotalPositions","BeginTime","EndTime","ContactFirstName","ContactLastName","ContactEmailAddress","Description","nonprofitorgid","State","Date")'+
       'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING "Id"'
      const event = [req.body.event,req.body.address1, req.body.address2, req.body.city, req.body.zip, req.body.totalpositions, req.body.begintime, req.body.endtime, req.body.contactfirstname, req.body.contactlastname, req.body.contactemail, req.body.description, nonprofitorgid, req.body.state, TO_DATE(req.body.date, 'MM/DD/YYYY')];
      pool.query(sqlInsert, event, (err, result) => {
        if (err) {
          return console.error("Error while creating an event - "+ err.message);
        }
        else 
        { var newlyCreatedUserId = result.rows[0].Id;
          console.log("event id created : "+newlyCreatedUserId)
        }

    });
      res.redirect('/view-events')
    } catch {
      res.redirect('/add-event')
    }
  })
 

  
  app.get('/volunteer-login', checkNotAuthenticated, (req, res) => {
    res.render('volunteer-login.ejs')
  })
  
  app.post('/volunteer-login',checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/search-event',
    failureRedirect: '/volunteer-login',
    failureFlash: true
  })
  )

  app.get('/nonprofit-org-login', (req, res) => {
    res.render('nonprofit-org-login.ejs')
  })
  
 /* app.post('/nonprofit-org-login',checkNotAuthenticated,

    passport.authenticate('local', {
      successRedirect: '/volunteer',
      failureRedirect: '/nonprofit-org-login',
      failureFlash: true
    })
  
 );*/

  
 app.post('/nonprofit-org-login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    console.log("insite auth")
    
    if (err) { return next(err); }
    if (!user) { return res.redirect('/nonprofit-org-login'); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      console.log("in nonprofitorg email" + sess.email);
      const sqlUserExists = 'SELECT "Orgname" as name , "Id" as id FROM vms."nonprofit_org" where "EmailAddress" = $1'
      pool.query(sqlUserExists , [sess.email], (err, result1) => {
        if (err) {
          return console.error(err.message);
        }
        else
        {if (result1.rows.length>0)
          {
            console.log('email exists:' + result1.rows[0].name);
            sess = req.session;
            sess.name1 =result1.rows[0].name;
            sess.nonprofitorgid=result1.rows[0].id;
            console.log('session name:' + sess.name1);
          }}})
      console.log("email" + sess.email);
      console.log("insite auth success")
      return res.redirect('/view-events');
    });
  })(req, res, next);
});

   app.get('/nonprofit-org-signup',  (req, res) => {
    res.render('nonprofit-org-signup.ejs')

  })   

  app.post('/nonprofit-org-signup', checkNotAuthenticated, async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      users.push({
        id: Date.now().toString(),
        name: req.body.contactfirstname,
        email: req.body.email,
        password: hashedPassword
      })
      const sqlUserExists = 'SELECT "EmailAddress" as emailAddress FROM vms."nonprofit_org" where "EmailAddress" = $1'
      pool.query(sqlUserExists , [req.body.email], (err, result1) => {
        if (err) {
          return console.error(err.message);
        }
        else
        {if (result1.rows.length>0)
          {
            console.log('email exists:' + result1.rows[0].emailAddress)
            console.log('email exists:' + result1)}}})
        
      const sqlInsert = 'INSERT INTO vms."nonprofit_org" ("Orgname","ContactFirstName","ContactLastName","Address1","City","State","Zip","EmailAddress","Password") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING "Id"'
      const nonprofitorg = [req.body.orgname,req.body.contactfirstname,req.body.contactlastname,req.body.address1,req.body.city,req.body.state,req.body.zip,req.body.email,hashedPassword];
      pool.query(sqlInsert, nonprofitorg, (err, result) => {
        if (err) {
          return console.error(err.message);
        }
        else 
        { var newlyCreatedUserId = result.rows[0].Id;
          console.log("id created : "+newlyCreatedUserId)
          /*const loginInfo = [newlyCreatedUserId, hashedPassword ];
          const sqlLoginInfoInsert = 'INSERT INTO vms."LoginInfo" ("UserId","Password") VALUES ($1, $2)'
          pool.query(sqlLoginInfoInsert, loginInfo, (err, result) => {
            if (err) {
              return console.error("Error while inserting into LoginInfo table :"+err.message);
            }
        })*/}
        //res.redirect("/volunteer-signup");
    });
      res.redirect('/nonprofit-org-login')
    } catch {
      res.redirect('/nonprofit-org-signup')
    }
  })
 
  
  app.get('/volunteer-signup', (req, res) => {
    res.render('volunteer-signup.ejs')

  })
  
  app.post('/volunteer-signup', checkNotAuthenticated, async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      users.push({
        id: Date.now().toString(),
        name: req.body.firstname,
        email: req.body.email,
        password: hashedPassword
      })
      console.log("inside volunteer signup")
      const sqlInsert = 'INSERT INTO vms."volunteer" ("FirstName","LastName","EmailAddress","Password") VALUES ($1, $2, $3, $4) RETURNING "Id"'
      const volunteer = [req.body.firstname,req.body.lastname, req.body.email, hashedPassword];
      pool.query(sqlInsert, volunteer, (err, result) => {
        console.log("inside volunteer signup 1")
        if (err) {
          console.log("inside volunteer signup error"+ err.message)
          return console.error(err.message);
        }
        else 
        { 
          console.log("inside volunteer signup 2")
          var newlyCreatedUserId = result.rows[0].Id;
          console.log("id created : "+newlyCreatedUserId)
          /*const loginInfo = [newlyCreatedUserId, hashedPassword ];
          const sqlLoginInfoInsert = 'INSERT INTO vms."LoginInfo" ("UserId","Password") VALUES ($1, $2)'
          pool.query(sqlLoginInfoInsert, loginInfo, (err, result) => {
            if (err) {
              return console.error("Error while inserting into LoginInfo table :"+err.message);
            }
        })*/}
        //res.redirect("/volunteer-signup");
    });
      res.redirect('/volunteer-login')
    } catch {
      res.redirect('/volunteer-signup')
    }
  })
  
  app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/volunteer-login')
  })
  
  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
  
    res.redirect('/volunteer-login')
  }

  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      console.log("testing session")
      req.session.user = {
        email: req.body.email,
        name: req.body.name
      } ;
      return res.redirect('/volunteer')
    }
    next()
  }

  function setSession(req) {
    console.log("testing session")
    req.session.user = {
      email: req.body.email,
      name: req.body.name
    } ;

  }
  
  app.listen(3000)