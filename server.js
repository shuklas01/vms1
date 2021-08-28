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
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  }))
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(methodOverride('_method'))
  
  app.get('/', checkAuthenticated, (req, res) => {
   
    res.render('index.ejs',{ name: req.user.name })
    
  })
  
  app.get('/test',  (req, res) => {

    const sql = 'SELECT * FROM vms.Volunteer'
    pool.query(sql , [], (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      console.log(result)
      res.render('test.ejs', { model: result.rows });
    });
  });
    
  
  app.get('/volunteer-login', checkNotAuthenticated, (req, res) => {
    res.render('volunteer-login.ejs')
  })
  
  app.post('/volunteer-login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/volunteer-login',
    failureFlash: true
  })
  )

  /*app.post('/volunteer-login', checkNotAuthenticated, (req, res) => {
    const hashedPassword1 = bcrypt.hash(req.body.password, 10)
    const sql = 'SELECT "Password" as password FROM vms.Volunteer WHERE "EmailAddress" = $1'
    pool.query(sql , [req.body.email], (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      if (result.rows.length>0)
      {
        console.log('password from db:' + result.rows[0].password)
        console.log('password from ui:' + password)
        try {
          if ( bcrypt.compare(password, result.rows[0].password)) {
            console.log('password is matching')
          } else {
            console.log('password is not matching')
          }
        } catch (e) {
          console.log(e)
        }
      }
      
      res.render('volunteer-signup.ejs')
    });
   })*/
  
  app.get('/volunteer-signup', checkNotAuthenticated, (req, res) => {
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
      const sqlInsert = 'INSERT INTO vms.Volunteer ("FirstName","LastName","EmailAddress","Password") VALUES ($1, $2, $3, $4)'
      const volunteer = [req.body.firstname,req.body.lastname, req.body.email, hashedPassword ];
      pool.query(sqlInsert, volunteer, (err, result) => {
        if (err) {
          return console.error(err.message);
        }
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
      return res.redirect('/')
    }
    next()
  }
  
  app.listen(3000)