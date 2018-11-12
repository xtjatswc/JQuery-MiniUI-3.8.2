using System;
using System.Collections.Generic;
using System.Web;
using System.Collections;

namespace Plusoft.DAL
{
    public class PositionDAL : BaseDAL
    {
        protected override String TableName
        {
            get { return "t_position"; }
        }

        public ArrayList FindAllByDeptId(String deptId) 
	    {
		    String sql = "select * from t_position where dept_id = '" + deptId + "'";
		    return Select(sql);
	    }
    }
}