using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

using System.Collections;
using System.Reflection;

using Plusoft.Web;

public partial class scripts_miniui_demo_filemanager_FileService : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        new FileService(Request, Response);
        
    }
    
}