using System;
using System.Collections.Generic;
using System.Web;

using System.Collections;
using System.Reflection;
using Plusoft.Utils;
using Plusoft.BLL;

namespace Plusoft.Web
{
    public class BaseService
    {
        protected HttpRequest Request;
        protected HttpResponse Response;

        public BaseService(HttpRequest Request, HttpResponse Response)
        {
            this.Request = Request;
            this.Response = Response;

            String methodName = Request["method"];

            try
            {
                Type type = this.GetType();
                MethodInfo method = type.GetMethod(methodName);
                if (method == null) throw new Exception("The method \"" + methodName + "\" is not found.");

                BeforeInvoke(methodName);
                method.Invoke(this, null);                
            }
            catch (Exception ex)
            {
                if (ex.InnerException != null) ex = ex.InnerException;
                Hashtable result = new Hashtable();
                result["success"] = false;
                result["error"] = -1;
                result["message"] = ex.Message;
                result["stackTrace"] = ex.StackTrace;
                String json = JSON.Encode(result);
                Response.Clear();
                Response.Write(json);
            }
            finally
            {
                AfterInvoke(methodName);
            }
        }

        protected virtual void BeforeInvoke(String methodName)
        {
            //是否登录、权限判断等
        }

        protected virtual void AfterInvoke(String methodName)
        {
        }

        public String GetString(String name) {
		    return Request[name];
	    }
	
	    public int GetInt(String name) {		
		    return Convert.ToInt32(GetString(name));
	    }
	
	    public bool GetBoolean(String name) {
		    return Convert.ToBoolean(GetString(name));
	    }

        public DateTime GetDateTime(String name)
        {
            return Convert.ToDateTime(GetString(name));
        }

        public Object GetObject(String name)
        {
            return JSON.Decode(GetString(name));
        }

	    public Hashtable GetHashtable(String name) {
		    return (Hashtable)JSON.Decode(GetString(name));
	    }
	
	    public ArrayList GetArrayList(String name) {
		    return (ArrayList)JSON.Decode(GetString(name));
	    }
	
	    public void RenderJson(Object obj) {
		    String json = JSON.Encode(obj);
	        Response.Write(json);
	    }
	
	    public void RenderText(String text) {
            Response.Write(text);
	    }

    }
}