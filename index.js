(function(ext) {

  const GRAVITY = 9.81; // meters per second squared
  const AIR_RESISTANCE = 0.02;
  
  let world = null;
  let bodies = [];
  
  // define blocks
  ext._shutdown = function() {};
  ext._getStatus = function() {
    return {status: 2, msg: 'Ready'};
  };

  ext.createWorld = function() {
    world = new PhysicsWorld();
  };

  ext.createBody = function(shape, options) {
    const body = new PhysicsBody(shape, options);
    bodies.push(body);
    return body.id;
  };

  ext.applyForce = function(bodyId, force) {
    const body = getBodyById(bodyId);
    body.applyForce(force);
  };

  ext.applyTorque = function(bodyId, torque) {
    const body = getBodyById(bodyId);
    body.applyTorque(torque);
  };

  ext.setLinearVelocity = function(bodyId, velocity) {
    const body = getBodyById(bodyId);
    body.setLinearVelocity(velocity);
  };

  ext.setAngularVelocity = function(bodyId, velocity) {
    const body = getBodyById(bodyId);
    body.setAngularVelocity(velocity);
  };

  ext.setGravity = function(acceleration) {
    world.setGravity(acceleration);
  };

  // helper functions
  function getBodyById(id) {
    for (let i = 0; i < bodies.length; i++) {
      if (bodies[i].id === id) {
        return bodies[i];
      }
    }
    return null;
  }

  // classes
  class PhysicsWorld {
    constructor() {
      this.gravity = {x: 0, y: GRAVITY};
    }
    
    setGravity(acceleration) {
      this.gravity = acceleration;
    }
  }
  
  class PhysicsBody {
    constructor(shape, options) {
      this.id = Math.random().toString(36).substr(2, 9);
      this.shape = shape;
      this.mass = options.mass || 1;
      this.position = options.position || {x: 0, y: 0};
      this.velocity = options.velocity || {x: 0, y: 0};
      this.acceleration = {x: 0, y: 0};
      this.torque = 0;
      this.angularVelocity = 0;
      this.angularAcceleration = 0;
      this.friction = options.friction || 0.5;
      this.restitution = options.restitution || 0.5;
      this.static = options.static || false;
      this.angle = 0;
    }
    
    applyForce(force) {
      this.acceleration.x += force.x / this.mass;
      this.acceleration.y += force.y / this.mass;
    }
    
    applyTorque(torque) {
      this.angularAcceleration += torque / this.mass;
    }
    
    setLinearVelocity(velocity) {
      this.velocity = velocity;
    }
    
    setAngularVelocity(velocity) {
      this.angularVelocity = velocity;
    }
    
    update(dt) {
      if (!this.static) {
        // apply gravity
        this.acceleration.x += world.gravity.x;
        this.acceleration.y += world.gravity.y;
      
        // apply air resistance
        this.acceleration.x -= this.velocity.x * AIR_RESISTANCE;
        this.acceleration.y -= this.velocity.y * AIR_RESISTANCE;
      
        // update position
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y
