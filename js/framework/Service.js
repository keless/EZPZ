"use strict"; //ES6

/**
 * Singleton provider
 *  ex:
 * 		var graphics = Service.Get("gfx");
 */
class Service {

  //static g_services = [];
  
  static Get(serviceName) {
	  if(!this.g_services) this.g_services = [];
	  
	  return this.g_services[serviceName];
  }
  
  static Add(serviceName, service) {
	  if(!this.g_services) this.g_services = [];
    if (this.g_services[serviceName]) {
      console.warn("Service " + serviceName + " overrided!")
    }
	  this.g_services[serviceName] = service;
  }

  static Remove(serviceName) {
    delete this.g_services[serviceName];
  }
}