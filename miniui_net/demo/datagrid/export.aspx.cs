using System;
using System.Collections.Generic;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Collections;

using System.Data;
using System.IO;
using System.Text;
using Plusoft.BLL;
using Plusoft.Utils;

public partial class demo_datagrid_export : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        String type = Request["type"];

        switch (type)
        {
            case "excel":
                //数据来源
                ArrayList data = SearchEmployees();

                String json = Request["columns"];
                ArrayList columns = (ArrayList)JSON.Decode(json);

                ExportExcel(columns, data);
                break;
            default:
                break;
        }
    }
    public ArrayList SearchEmployees()
    {
        //查询条件
        string key = Request["key"];

        //字段排序
        String sortField = Request["sortField"];
        String sortOrder = Request["sortOrder"];

        Hashtable result = new AppService().SearchEmployeesResult(key, 0, 10000, sortField, sortOrder);
        return result["data"] as ArrayList;
    }

    public void ExportExcel(ArrayList columns, ArrayList data)
    {
        Response.Clear();
        Response.Buffer = true;
        Response.Charset = "GB2312";
        //Response.Charset = "UTF-8";
        Response.AppendHeader("Content-Disposition", "attachment;filename=" + "grid" + ".xls");
        Response.ContentEncoding = System.Text.Encoding.GetEncoding("GB2312");//设置输出流为简体中文
        Response.ContentType = "application/ms-excel";//设置输出文件类型为excel文件。
        EnableViewState = false;
        Response.Write(ExportTable(data, columns));
        Response.End();

    }
    public static string ExportTable(ArrayList data, ArrayList columns)
    {

        ArrayList columnsBottom = getColumnsBottom(columns);

        ArrayList columnsTable = getColumnsTable(columns);

        StringBuilder sb = new StringBuilder();
        //data = ds.DataSetName + "\n";

        //dg.Cells[10].Attributes.Add("style", "vnd.ms-excel.numberformat: @;");

        //data += tb.TableName + "\n";
        sb.AppendLine("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=gb2312\">");
        sb.AppendLine("<table cellspacing=\"0\" cellpadding=\"5\" rules=\"all\" border=\"1\">");
        //写出列名

        for (int i = 0; i < columnsTable.Count; i++)
        {
            ArrayList columnsRow = (ArrayList)columnsTable[i];
            sb.AppendLine("<tr style=\"font-weight: bold; white-space: nowrap;\">");
            foreach (Hashtable column in columnsRow)
            {
                sb.AppendLine("<td colspan=" + column["colspan"] + " rowspan=" + column["rowspan"] + ">" + column["header"] + "</td>");
            }
            sb.AppendLine("</tr>");
        }
        //写出数据

        int count = 0;
        foreach (Hashtable row in data)
        {
            sb.Append("<tr>");
            foreach (Hashtable column in columnsBottom)
            {
                Object value;
                if (column["field"] != null)
                {
                    value = row[column["field"]];
                }
                else
                {
                    value = "";
                }
                if (Convert.ToString(column["type"]) == "indexcolumn") value = count + 1;
                sb.AppendLine("<td style=\"vnd.ms-excel.numberformat: @;\">" + value + "</td>");
            }
            sb.AppendLine("</tr>");
            count++;
        }
        sb.AppendLine("</table>");


        return sb.ToString();
    }

    public static ArrayList getColumnsBottom(ArrayList columns)
    {
        ArrayList columnsBottom = new ArrayList();

        for (int i = 0; i < columns.Count; i++)
        {
            Hashtable column = (Hashtable)columns[i];

            if (column["columns"] != null)
            {
                ArrayList childColumns = (ArrayList)column["columns"];
                columnsBottom.AddRange(getColumnsBottom(childColumns));
            }
            else
            {
                columnsBottom.Add(column);
            }

        }
        return columnsBottom;
    }

    public static ArrayList getColumnsTable(ArrayList columns)
    {
        ArrayList table = new ArrayList();

        getColumnsRows(columns, 0, table);

        createTableSpan(table);

        return table;

    }

    public static void getColumnsRows(ArrayList columns, int level, ArrayList table)
    {
        ArrayList row = null;
        if (table.Count > level)
        {
            row = (ArrayList)table[level];
        }
        else
        {
            row = new ArrayList();
            table.Add(row);
        }

        for (int i = 0; i < columns.Count; i++)
        {

            Hashtable column = (Hashtable)columns[i];
            ArrayList childColumns = (ArrayList)column["columns"];

            row.Add(column);

            if (childColumns != null)
            {

                getColumnsRows(childColumns, level + 1, table);
            }

        }
    }

    public static void createTableSpan(ArrayList table)
    {
        for (int i = 0; i < table.Count; i++)
        {
            ArrayList row = (ArrayList)table[i];  //row
            for (int l = 0; l < row.Count; l++)
            {
                Hashtable cell = (Hashtable)row[l];   //column

                int colSpan = getColSpan(cell);
                cell["colspan"] = colSpan;

                if (colSpan > 1)
                {
                    cell["rowspan"] = 1;
                }
                else
                {
                    cell["rowspan"] = table.Count - i;
                }

            }
        }
    }

    public static int getColSpan(Hashtable column)
    {
        int colSpan = 0;
        ArrayList childColumns = (ArrayList)column["columns"];
        if (childColumns != null)
        {
            for (int i = 0; i < childColumns.Count; i++)
            {
                Hashtable child = (Hashtable)childColumns[i];
                colSpan += getColSpan(child);
            }
        }
        else
        {
            colSpan = 1;
        }
        return colSpan;
    }

}
