using System;
using System.Collections.Generic;
using System.Web;

namespace Plusoft.DAL
{
    public class EduDAL : BaseDAL
    {
        protected override String TableName
        {
            get { return "t_educational"; }
        }
    }
}