/**
 * Module Dependencies
 */
// ...
// e.g.
// var _ = require('lodash');
// var mysql = require('node-mysql');
// ...

var crypto = require('crypto');
var firebase = require('firebase');
var FirebaseTokenGenerator = require("firebase-token-generator");
var Errors = require('waterline-errors');
var waterlinefilter = require('waterline-criteria');
/**
 * waterline-sails-firebase
 *
 * Most of the methods below are optional.
 *
 * If you don't need / can't get to every method, just implement
 * what you have time for.  The other methods will only fail if
 * you try to call them!
 *
 * For many adapters, this file is all you need.  For very complex adapters, you may need more flexiblity.
 * In any case, it's probably a good idea to start with one file and refactor only if necessary.
 * If you do go that route, it's conventional in Node to create a `./lib` directory for your private submodules
 * and load them at the top of the file with other dependencies.  e.g. var update = `require('./lib/update')`;
 */
module.exports = (function () {


  // You'll want to maintain a reference to each connection
  // that gets registered with this adapter.
  var connections = {};


  function isNull(data)
  {
      return (typeof data === "undefined" || data === null)
  }
  function isArray(data)
  {
    return (Object.prototype.toString.call( data ) === '[object Array]' )
  }
  function isObject(val) 
  {
    if (val === null) return false;
    return ( (typeof val === 'function') || (typeof val === 'object') );
  }
  function isDate(date)
  {
    return Object.prototype.toString.call(date) === '[object Date]'
  }
  function validate(model,values)
  {
      insails = true;
      try
      {
          insails =  !isNull(sails);
      }
      catch(err)
      {
        insails=false;
      }

      if(insails)
      {
        var definition = sails.models[model].definition
        var hash = ""
        for (var property in definition) 
        {
          if (definition.hasOwnProperty(property)) 
          {
              if(!isNull(definition[property].unique) && definition[property].unique===true)
              {
                  if(property!="createdAt"||property!="updateAt")hash = hash+"<"+values[property]+">";
              }
              if(!isNull(definition[property].required) && definition[property].required===true)
              {
                  if(isNull(values[property]))
                  {
                     values.error[property] = property+" is a required of "+model
                     values.valid = false;
                     return values;
                  }
              }
          }
        }
        for (var property in values) 
        {
          if (values.hasOwnProperty(property)) 
          {
              if(isNull(values[property])) values[property] = null;
          }
        }
        if(hash.length>0)
          values.id = crypto.createHmac('sha256', "sails-firebase").update(hash).digest('hex');
        else values.id=null;
        values.valid = true;
        return values;
      }
      else 
      {
        values.id=null;
        values.valid = true;
        return values;
      }
  }
  function inputFormat(values)
  {
    values.createdAt = values.createdAt.getTime()
    values.updatedAt = values.updatedAt.getTime()  
    for (var property in values) 
    {
      if (values.hasOwnProperty(property)) 
      {
          if(isNull(values[property])) values[property] = "{specialtype: null}";
          if(isDate(values[property])) values[property] = values[property].toISOString()
      }
    }
    return values  
  }
  function outputFormat(values)
  {
    if( isArray(values) ) 
    {
        var arrayoutput = []
        for (var i = values.length - 1; i >= 0; i--) {
          arrayoutput.unshift(outputFormatHelper(values[i]))
        };
        return arrayoutput;
    }
    else return outputFormatHelper(values)
    
  }
  function outputFormatHelper(values)
  {
    
    if(!isNull(values))
    {
      values.createdAt = new Date(values.createdAt)
      values.updatedAt = new Date(values.updatedAt)   
      for (var property in values) 
      {
        if (values.hasOwnProperty(property)) 
        {
            if(values[property]=="{specialtype: null}") values[property] = null;
            try
            {
               var temp =  Date.parse(values[property])
               if(iDate(temp)) values[property] = temp;
            }
            catch(e){}
        }
      }
      return values

    }
    else return null
  }
  // You may also want to store additional, private data
  // per-connection (esp. if your data store uses persistent
  // connections).
  //
  // Keep in mind that models can be configured to use different databases
  // within the same app, at the same time.
  //
  // i.e. if you're writing a MariaDB adapter, you should be aware that one
  // model might be configured as `host="localhost"` and another might be using
  // `host="foo.com"` at the same time.  Same thing goes for user, database,
  // password, or any other config.
  //
  // You don't have to support this feature right off the bat in your
  // adapter, but it ought to get done eventually.
  //

  var adapter = {

    // Set to true if this adapter supports (or requires) things like data types, validations, keys, etc.
    // If true, the schema for models using this adapter will be automatically synced when the server starts.
    // Not terribly relevant if your data store is not SQL/schemaful.
    //
    // If setting syncable, you should consider the migrate option,
    // which allows you to set how the sync will be performed.
    // It can be overridden globally in an app (config/adapters.js)
    // and on a per-model basis.
    //
    // IMPORTANT:
    // `migrate` is not a production data migration solution!
    // In production, always use `migrate: safe`
    //
    // drop   => Drop schema and data, then recreate it
    // alter  => Drop/add columns as necessary.
    // safe   => Don't change anything (good for production DBs)
    //
    migrate: 'safe',
    identity: 'sails-firebase',

    syncable: false,

    pkFormat: 'string',
  
    // Default configuration for connections
    defaults: {
			firebasesecret: 'thisissupersuperdupersecret',
      database: 'default',
      url: 'https://mediocreappname.firebaseio.com'
    },



    /**
     *
     * This method runs when a model is initially registered
     * at server-start-time.  This is the only required method.
     *
     * @param  {[type]}   connection [description]
     * @param  {[type]}   collection [description]
     * @param  {Function} cb         [description]
     * @return {[type]}              [description]
     */
    registerConnection: function(connection, collections, cb) {
      if(typeof connection.url === 'undefined' || connection.url === null)
        return cb(new Error('Firebase URL not provided'));
      if(!connection.identity) return cb(new Error('Connection is missing an identity.'));
      if(connections[connection.identity]) return cb(new Error('Connection is already registered.'));

      // Add in logic here to initialize connection
      // e.g. connections[connection.identity] = new Database(connection, collections);
      connections[connection.identity] = new Firebase(connection.url).child(connection.database);

      cb();
    },


    /**
     * Fired when a model is unregistered, typically when the server
     * is killed. Useful for tearing-down remaining open connections,
     * etc.
     *
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    // Teardown a Connection
    teardown: function (conn, cb) {

      if (typeof conn == 'function') {
        cb = conn;
        conn = null;
      }
      if (!conn) {
        connections = {};
        return cb();
      }
      if(!connections[conn]) return cb();
      delete connections[conn];
      cb();
    },


    // Return attributes
    describe: function (connection, collection, cb) {
			// Add in logic here to describe a collection (e.g. DESCRIBE TABLE logic)
      return cb();
    },

    /**
     *
     * REQUIRED method if integrating with a schemaful
     * (SQL-ish) database.
     *
     */
    define: function (connection, collection, definition, cb) {
			// Add in logic here to create a collection (e.g. CREATE TABLE logic)
      return cb();
    },

    /**
     *
     * REQUIRED method if integrating with a schemaful
     * (SQL-ish) database.
     *
     */
    drop: function (connection, collection, relations, cb) {
			// Add in logic here to delete a collection (e.g. DROP TABLE logic)
			return cb();
    },

    /**
     *
     * REQUIRED method if users expect to call Model.find(), Model.findOne(),
     * or related.
     *
     * You should implement this method to respond with an array of instances.
     * Waterline core will take care of supporting all the other different
     * find methods/usages.
     *
     */
    find: function (connection, collection, options, cb) {
			var ref = connections[connection].child(collection)
      var where = Object.keys(options.where)
      var querydata =options.where[where[0]];
      var query =  ref.orderByChild(where[0])
      if(!isObject(querydata)) query = ref.orderByChild(where[0]).equalTo(querydata)
      query.once('value', function (dataSnapshot) {
            var rawdata = dataSnapshot.val()
            var data = []
            for (var property in rawdata) 
            {
              if (rawdata.hasOwnProperty(property)) 
              {
                data.push(rawdata[property]);
              }
            }
            var halfwaydata = outputFormat(data)
            return cb(null,waterlinefilter(halfwaydata,options.where).results)
          }, function (err) {
            return cb(err)
          });
    },

    create: function (connection, collection, values, cb) {
      var validated = validate(collection,values)
      if(!validated.valid) return cb(validated.error)
      var ref = connections[connection].child(collection)
      if(validated.id===null)
      {
          delete validated["valid"]
          delete validated["error"]
          var tempref = ref.push()
          validated.id = tempref.key();
          tempref.set(inputFormat(validated))
          ref.child(validated.id).once('value', function (dataSnapshot) {
             return cb(null,outputFormat(dataSnapshot.val()))
          }, function (err) {
            return cb(err)
          }); 
      }
      else
      {
        ref.orderByChild("id").equalTo(validated.id).once('value', function (dataSnapshot) 
        {
              // code to handle new value
              var result = dataSnapshot.val()
              if(isNull(result))
              {
                delete validated["valid"]
                delete validated["error"]
                ref.child(validated.id).set(inputFormat(validated))
                ref.child(validated.id).once('value', function (dataSnapshot) {
                   return cb(null,outputFormat(dataSnapshot.val()))
                }, function (err) {
                  return cb(err)
                });
              }
              else
              {
                return cb(Errors.adapter.NotUnique)
              }
        }, function (err) 
        {
              // code to handle read error
              return cb(err)
         });
      }
    },

    update: function (connection, collection, options, values, cb) {
      

      return cb();
    },

    destroy: function (connection, collection, options, cb) {
      return cb();
    }

    /*

    // Custom methods defined here will be available on all models
    // which are hooked up to this adapter:
    //
    // e.g.:
    //
    foo: function (connection, collection, options, cb) {
      return cb(null,"ok");
    },
    bar: function (connection, collection, options, cb) {
      if (!options.jello) return cb("Failure!");
      else return cb();
      destroy: function (connection, collection, options, values, cb) {
       return cb();
     }

    // So if you have three models:
    // Tiger, Sparrow, and User
    // 2 of which (Tiger and Sparrow) implement this custom adapter,
    // then you'll be able to access:
    //
    // Tiger.foo(...)
    // Tiger.bar(...)
    // Sparrow.foo(...)
    // Sparrow.bar(...)


    // Example success usage:
    //
    // (notice how the first argument goes away:)
    Tiger.foo({}, function (err, result) {
      if (err) return console.error(err);
      else console.log(result);

      // outputs: ok
    });

    // Example error usage:
    //
    // (notice how the first argument goes away:)
    Sparrow.bar({test: 'yes'}, function (err, result){
      if (err) console.error(err);
      else console.log(result);

      // outputs: Failure!
    })




    */




  };


  // Expose adapter definition
  return adapter;

})();

