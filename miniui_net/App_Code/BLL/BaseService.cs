using System;
using System.Collections.Generic;
using System.Web;
using Plusoft.DAL;
using Plusoft.Factory;
using System.Collections;
using System.Data.Common;
using Plusoft.DBUtility;

namespace Plusoft.BLL
{
    public class BaseService
    {
        List<BaseDAL> dalList = new List<BaseDAL>();

        protected void AddTransaction(BaseDAL dal)
        {
            dalList.Add(dal);
        }

	    DbConnection conn;
	    protected DbTransaction StartTransaction() {
		    conn = DataBase.GetConnection();
            DbTransaction trans = conn.BeginTransaction();

            foreach (BaseDAL dal in dalList)
            {
                dal.db.trans = trans;
            }

            return trans;
	    }
        protected void CloseTransaction()
        {
		    if(conn != null) {
			    conn.Close();
			    conn = null;
                foreach (BaseDAL dal in dalList)
                {
                    dal.db.trans = null;
                }
		    }
	    }

    }
}