import { Component } from "@angular/core";
import { BuilderService } from "./builder.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  title = "ascension";
  colors = {
    Force: "rgb(255,50,50)",
    Inertia: "rgb(50,100,205)",
    Life: "rgb(245,195,65)",
    Form: "rgb(50,205,100)",
    Entropy: "rgb(150,0,150)"
  };

  constructor(public builder: BuilderService) {}

  checked(e, node, cls) {
    node.Selected = e.checked;
  }
}
