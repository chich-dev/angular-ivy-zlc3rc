import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class BuilderService {
  public AscensionClasses;
  public get Character() {
    return {
      CurrentAscension: this.CurrentAscension
    };
  }

  public get CurrentAscension() {
    if (this.AscensionClasses) {
      return {
        Force: this.AscensionClasses.filter(cls => {
          return cls.Completed;
        }).reduce((acc, item) => {
          return (acc += item.Grants.Force);
        }, 0),
        Entropy: this.AscensionClasses.filter(cls => {
          return cls.Completed;
        }).reduce((acc, item) => {
          return (acc += item.Grants.Entropy);
        }, 0),
        Life: this.AscensionClasses.filter(cls => {
          return cls.Completed;
        }).reduce((acc, item) => {
          return (acc += item.Grants.Life);
        }, 0),
        Form: this.AscensionClasses.filter(cls => {
          return cls.Completed;
        }).reduce((acc, item) => {
          return (acc += item.Grants.Form);
        }, 0),
        Inertia: this.AscensionClasses.filter(cls => {
          return cls.Completed;
        }).reduce((acc, item) => {
          return (acc += item.Grants.Inertia);
        }, 0)
      };
    } else {
      return {
        Force: 0,
        Entropy: 0,
        Life: 0,
        Form: 0,
        Inertia: 0
      };
    }
  }

  public get AvailableClasses() {
    if (this.AscensionClasses) {
      return this.AscensionClasses.filter(cls => {
        return (
          !cls.Completed &&
          this.Character.CurrentAscension.Force >= cls.Requires.Force &&
          this.Character.CurrentAscension.Entropy >= cls.Requires.Entropy &&
          this.Character.CurrentAscension.Life >= cls.Requires.Life &&
          this.Character.CurrentAscension.Form >= cls.Requires.Form &&
          this.Character.CurrentAscension.Inertia >= cls.Requires.Inertia
        );
      });
    } else {
      return [];
    }
  }

  public get CompletedClasses() {
    if (this.AscensionClasses) {
      return this.AscensionClasses.filter(cls => {
        return cls.Completed;
      });
    } else {
      return [];
    }
  }

  constructor(private http: HttpClient) {
    this.http.get("/assets/ascension.json").subscribe(data => {
      this.AscensionClasses = (data as Array<any>).map(cls => {
        return new AscensionClass(cls);
      });
      console.log(this.AscensionClasses);
    });
  }
}

export class AscensionNode {
  private _selected = false;
  public set Selected(value) {
    this._selected = value;
  }
  public get Selected() {
    return (
      this._selected ||
      this.SubNodes.reduce((acc, item) => {
        return acc || item.Selected;
      }, false)
    );
  }
  SubNodes: Array<AscensionNode>;
  ID;
  Raw;
  Activation;
  Modifiers;
  Stats;

  constructor(data) {
    (this.ID = data.ID), (this.Raw = data.Raw);
    this.Activation = data.Activation;
    this.Modifiers = data.Modifiers;
    this.Stats = data.Stats;
    this.SubNodes = data.SubNodes
      ? data.SubNodes.map(sn => {
          return new AscensionNode(sn);
        })
      : [];
  }
}

export class AscensionClass {
  public get Completed() {
    return this.Nodes.reduce((acc, item) => {
      return item.Selected && acc;
    }, true);
  }
  Nodes: Array<AscensionNode>;
  Name;
  Group;
  Grants;
  Requires;

  constructor(data) {
    this.Nodes = data.Nodes.map(nd => {
      return new AscensionNode(nd);
    });
    this.Name = data.Name;
    this.Grants = data.Grants;
    this.Group = data.Group;
    this.Requires = data.Requires;
  }
}
