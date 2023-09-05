export type callback = (value : any)=>void;

export interface Ibinder{
	(key: string, cb : callback) : void;
	binding? : any;
	properties? : any;
	globalBindings? : any[];
	bind?: (key: string, cb : callback) => void;
	bindGlobal?: (cb: callback) => void;
	set?: (key: string, value: any) => void;
	get?: (key: string) => any;
};

export default function() : Ibinder {
	let binder : Ibinder = (key: string, cb : callback) : void =>{
		binder.bind(key, cb);
	};

	binder.properties = {};
	binder.globalBindings = [];

	binder.binding = class{
		_value : any;
		_bindings : any[] = [];
		_key : string;
		
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
		if(binder.properties[key] == undefined){return undefined;};
		return binder.properties[key].value;
	};

	return binder;
};












