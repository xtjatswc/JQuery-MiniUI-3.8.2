using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Collections;
using System.Reflection;

using Plusoft.Web;

public partial class demo_form_FormService : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        new FormService(Request, Response);   
    }

    
}