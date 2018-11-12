using System;
using System.Collections.Generic;
using System.Web;
using Plusoft.DAL;

namespace Plusoft.Factory
{
    public class DALFactory
    {
        public static EmployeeDAL GetEmployeeDAL()
        {
            return new EmployeeDAL();
        }

        public static DeptDAL GetDeptDAL()
        {
            return new DeptDAL();
        }

        public static EduDAL GetEduDAL()
        {
            return new EduDAL();
        }

        public static PositionDAL GetPositionDAL()
        {
            return new PositionDAL();
        }

        public static FileDAL GetFileDAL()
        {
            return new FileDAL();
        }
    }
}