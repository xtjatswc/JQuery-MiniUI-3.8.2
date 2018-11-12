using System;
using System.Collections.Generic;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

using Plusoft.Web;

public partial class demo_data_TreeService : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        new TreeService(Request, Response);
    }
    
}