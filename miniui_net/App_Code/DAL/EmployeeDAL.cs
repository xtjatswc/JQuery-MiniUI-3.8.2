using System;
using System.Collections.Generic;
using System.Web;
using System.Collections;

namespace Plusoft.DAL
{
    public class EmployeeDAL : BaseDAL
    {
        protected override String TableName
        {
            get { return "t_employee"; }
        }

        protected override String SelectSql {
            get{
                return "select a.*, b.name dept_name, c.name position_name, d.name educational_name \n"
				         +"from t_employee a \n"
				         +"left join t_department b \n"
				         +"on a.dept_id = b.id \n"
				         +"left join t_position c \n"
				         +"on a.position = c.id \n"
				         +"left join t_educational d \n"
				         +"on a.educational = d.id \n";
            }
	    }
	
	    protected override String FindByIdSql {
		    get{ return SelectSql +" where a.id = @id";}
	    }
	
	    public ArrayList FindAllByDetpId (String deptId, int pageIndex, int pageSize) 
	    {
	        String sql = SelectSql + "where a.dept_id = '" + deptId + "'";
	        return SelectPage(sql, pageIndex, pageSize);
	    }	

        public ArrayList Search(String key, int pageIndex, int pageSize, String sortField, String sortOrder)
        {
            ArrayList sortFields = new ArrayList();        
            if (String.IsNullOrEmpty(sortField) == false) {
                Hashtable p = new Hashtable();
	            p["field"] = sortField;
	            p["dir"] = sortOrder;
	            sortFields.Add(p);
            }
            
            return Search(key, pageIndex, pageSize, sortFields);
        }	
	
	    public ArrayList Search(String key, int pageIndex, int pageSize, ArrayList sortFields) 
        {
    	    if(key == null) key = "";
    	
    	    String sql = SelectSql +"where a.name like '%" + key + "%' \n";
    	
            if (sortFields != null && sortFields.Count > 0)
            {
                sql += CreateOrderSql(sortFields, "a.");
            }
            else
            {
                sql += " order by a.createtime desc";
            }
    	
    	    return SelectPage(sql, pageIndex, pageSize);
        }
    }
}