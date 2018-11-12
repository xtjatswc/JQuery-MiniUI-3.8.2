using System;
using System.Collections.Generic;
using System.Web;

namespace Plusoft.DAL
{
    public class FileDAL : BaseDAL
    {
        protected override String TableName
        {
            get { return "plus_file"; }
        }
    }
}