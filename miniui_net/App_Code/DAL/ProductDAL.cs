using System;
using System.Collections.Generic;
using System.Web;
using System.Collections;

namespace Plusoft.DAL
{
    public class ProductDAL : BaseDAL
    {
        protected override String TableName
        {
            get { return "t_product"; }
        }
               
    }
}