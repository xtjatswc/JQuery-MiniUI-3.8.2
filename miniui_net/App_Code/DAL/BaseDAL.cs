using System;
using System.Collections.Generic;
using System.Web;
using System.Collections;
using Plusoft.DBUtility;
using System.Data.Common;

namespace Plusoft.DAL
{
    public class BaseDAL
    {
        protected virtual String TableName{
            get{ return "";}
        }
        protected virtual String IdField
        {
            get { return "id"; }
        }
        protected virtual String TableIdField
        {
            get { return IdField; }
        }
        protected virtual String InsertSql
        {
            get { return CreateInsertSql(TableName); }
        }
        protected virtual String UpdateSql
        {
            get { return CreateUpdateSql(TableName, TableIdField); }
        }
        protected virtual String DeleteSql
        {
            get { return "delete from " + TableName + " where " + TableIdField + " = @id"; }
        }
        protected virtual String SelectSql
        {
            get { return "select * from " + TableName; }
        }
        protected virtual String FindByIdSql
        {
            get { return SelectSql + " where " + TableIdField + " =@" + IdField; }
        }
        protected virtual Boolean UpdateByDelete
        {
            get { return true; }
        }
        protected virtual Boolean IdAutoincrement
        {
            get { return false; }
        }
	
	    public virtual Object Insert(Hashtable o)  {		
		    Object id = AutoId(o, IdField);
            Execute(InsertSql, o);

            //如果是自增长id
            if (IdAutoincrement)
            {
                id = db.SelectScalar("select @@IDENTITY");

                //int id = (Integer)db.selectScalar("select @@IDENTITY"));			//sqlserver
                //int id = (Integer)db.selectScalar("select last_insert_id()"));	//mysql
            }

            return id;
	    }

        public virtual void Delete(String id)       //复合主键？
        {
            Hashtable param = new Hashtable();
            param["id"] = id;
            Execute(DeleteSql, param);
        }

        public virtual void Update(Hashtable o)
        {
		    String id = Convert.ToString(o[IdField]);
		    if(!String.IsNullOrEmpty(id)) {
                Hashtable to = FindById(id);
                if (to == null) return;
                CopyFrom(to, o);

                if (UpdateByDelete && !IdAutoincrement)
                {
                    Delete(id);
                    Insert(to);
                }
                else
                {
                    Execute(UpdateSql, to);
                }
		    }
	    }

        public virtual Hashtable FindById(String id) //复合主键？
        {
            Hashtable param = new Hashtable();
            param[IdField] = id;
            return SelectFirst(FindByIdSql, param);
        }

        public virtual ArrayList FindAll()
        {
            String sql = SelectSql;
            return Select(sql);
        }

        public virtual ArrayList FindAll(int pageIndex, int pageSize)
        {
            String sql = SelectSql;
            return SelectPage(sql, pageIndex, pageSize);
        }

        public virtual ArrayList FindAll(String sqlSuffix, int pageIndex, int pageSize) 
        {
            if (sqlSuffix == null) sqlSuffix = "";
            String sql = SelectSql + " " + sqlSuffix;
    	        	    
    	    return SelectPage(sql, pageIndex, pageSize);
        }

        public virtual int GetCount()
        {
            return GetCount("");
        }

        public virtual int GetCount(String where)
        {
            String sql = "select count(1) from " + TableName;
            if (!String.IsNullOrEmpty(where))
            {
                sql += " where " + where;
            }
            return Convert.ToInt32(db.SelectScalar(sql));
        }

        protected virtual Object ModelFrom(Hashtable o)
        {
            Hashtable model = o;

            return model;
        }


        //private Hashtable fieldMapping;                //字段映射对象    

        //public BaseDAL()
        //{
        //    fieldMapping = CreateMapping();
        //}
        //protected virtual Object ModelFrom(Hashtable o)
        //{
        //    Hashtable model = o;

        //    if (fieldMapping != null)
        //    {
        //        model = new Hashtable();

        //        foreach (DictionaryEntry de in fieldMapping)
        //        {
        //            model[de.Key.ToString()] = o[de.Value.ToString()];
        //        }
        //    }

        //    return model;
        //}

        //protected virtual Hashtable CreateMapping()
        //{
        //    return null;
        //}

        
	    ///////////////////////////////////////////////////////////////////////
	
	    public DataBase db = new DataBase();
	
	    protected void Execute(String sql)  {
		    Execute(sql, null);
	    }
	    
	    protected void Execute(String sql, Hashtable param)  {
		    db.Execute(sql, param);	
	    }
	
	    protected ArrayList Select(String sql)  {
		    return Select(sql, null);
	    }
	
	    protected ArrayList Select(String sql, Hashtable param)  {		    
            return SelectPage(sql, param, -1, 0);
	    }
	    
	    protected Hashtable SelectFirst(String sql)  {
		    return SelectFirst(sql, null);
	    }
	    
	    protected Hashtable SelectFirst(String sql, Hashtable param)  {
		    Hashtable o = db.SelectFirst(sql, param);
            if (o != null) o = (Hashtable)ModelFrom(o);
		    return o;
	    }
	
	    protected ArrayList SelectPage(String sql, int pageIndex, int pageSize)  {
		    return SelectPage(sql, null, pageIndex, pageSize);
	    }
	
	    protected ArrayList SelectPage(String sql, Hashtable param, int pageIndex, int pageSize)  {
            ArrayList list = db.Select(sql, param, pageIndex, pageSize);
            for (int i = 0, l = list.Count; i < l; i++)
            {
                Hashtable o = (Hashtable)list[i];
                list[i] = (Hashtable)ModelFrom(o);
            }
            return list;
        }
	
	    protected virtual String AutoId(Hashtable o, String idField) {
            String id = o[idField] == null ? null : o[idField].ToString();
		    if(id == null) {
                id = Guid.NewGuid().ToString();
		    }
		    o[idField] = id;
		    return id;
	    }
	
	    protected void CopyFrom(Hashtable to, Hashtable from) {
            foreach (DictionaryEntry de in from)
            {
                to[de.Key] = de.Value;
            }
	    }

        protected String CreateOrderSql(ArrayList sortFields, String namePrefix)
        {
            return DataBase.CreateOrderSql(sortFields, namePrefix);
        }

        protected String CreateInsertSql(String tableName)
        {
            return DataBase.CreateInsertSql(tableName);
        }

        protected String CreateUpdateSql(String tableName, String tableIdField)
        {
            return DataBase.CreateUpdateSql(tableName, tableIdField);
        }

    }
}