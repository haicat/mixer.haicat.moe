var binder = function(key, callback){
	binder.bind(key, callback);
};

binder.properties = {};
binder.globalBindings = [];

binder.binding = class{
	_value;
	_bindings = [];
	_key;
	
	constructor(k,v){
		this._key = k;
		this._value = v;
	}
	
	bind(callback){
		this._bindings.push(callback);
		callback(this._value);
	}
	
	get value(){
		return this._value;
	}
	
	set value(v){
		this._value = v;
		for(let c of this._bindings){
			c(this._value);
		}
		for(let c of binder.globalBindings){
			c(this._key,this._value);
		}
	}
};

binder.bind = function(key, callback){
	if(binder.properties[key] == undefined){
		binder.properties[key] = new binder.binding(key);
	};
	binder.properties[key].bind(callback);
};

binder.bindGlobal = function(callback){
	binder.globalBindings.push(callback);
};

binder.set = function(key, value){
	if(binder.properties[key] == undefined){
		binder.properties[key] = new binder.binding(key);
	};
	binder.properties[key].value = value;
};

binder.get = function(key){
	return binder.properties[key].value;
};

export default binder;