using System;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using Plusoft.Utils;
using Plusoft.Web;
public partial class demo_data_AjaxService : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        new AjaxService(Request, Response);
    }
    

}