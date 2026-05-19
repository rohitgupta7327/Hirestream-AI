using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HirestreamAI_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Organization",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Organization",
                table: "Users");
        }
    }
}
