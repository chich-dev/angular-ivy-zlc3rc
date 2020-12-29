import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class BuilderService {
  public AscensionClasses;
  public Filters = {
    Statistics: [],
    Activators: [],
    Raw: ""
  };
  public get Character() {
    return {
      CurrentAscension: this.CurrentAscension,
      Statistics: this.Statistics,
      Modifiers: this.Modifiers
    };
  }

  public get QueryMatches() {
    return this.AscensionClasses
      ? this.AscensionClasses.reduce((acc, item) => {
          let result = true;

          if (this.Filters.Raw) {
            result = result && item.hasRaw(this.Filters.Raw);
          }

          this.Filters.Statistics.map(stat => {
            result = result && item.hasStatistic(stat);
          });

          if (result) {
            acc.push(item);
          }
          return acc;
        }, [])
      : [];
  }

  public get AllStatistics() {
    return this.AscensionClasses
      ? this.AscensionClasses.reduce((acc, item) => {
          item.Nodes.forEach(node => {
            if (node.Stats) {
              for (var name in node.Stats) {
                if (!acc[name]) {
                  acc[name] = false;
                }
              }
              node.SubNodes.map(snode => {
                for (var name in snode.Stats) {
                  if (!acc[name]) {
                    acc[name] = false;
                  }
                }
              });
            }
          });
          return acc;
        }, {})
      : {};
  }

  public get AllActivators() {
    return this.AscensionClasses
      ? this.AscensionClasses.reduce((acc, item) => {
          item.Nodes.forEach(node => {
            if (node.Activation) {
              node.Activation.forEach(activator => {
                if (!acc[activator]) {
                  acc[activator] = false;
                }
              });

              node.SubNodes.map(snode => {
                snode.Activation.forEach(activator => {
                  if (!acc[activator]) {
                    acc[activator] = false;
                  }
                });
              });
            }
          });
          return acc;
        }, {})
      : {};
  }

  public get Statistics() {
    let result = {};
    if (this.AscensionClasses) {
      this.AscensionClasses.forEach(item => {
        item.SelectedNodes.forEach(node => {
          for (var name in node.Stats) {
            if (result[name]) {
              result[name] += parseFloat(node.Stats[name]);
            } else {
              result[name] = parseFloat(node.Stats[name]);
            }
          }
        });
      });
    }
    return result;
  }

  public get PointsUsed() {
    if (this.AscensionClasses) {
      return this.AscensionClasses.reduce((acc, item) => {
        acc += item.SelectedNodesFromPoints.length;
        return acc;
      }, 0);
    } else {
      return 0;
    }
  }

  public get Modifiers() {
    let result = [];
    if (this.AscensionClasses) {
      this.AscensionClasses.forEach(item => {
        item.SelectedNodes.forEach(node => {
          result = result.concat(node.Modifiers);
        });
      });
    }
    return result;
  }

  public get CurrentAscension() {
    if (this.AscensionClasses) {
      return {
        Force:
          this.AscensionClasses.filter(cls => {
            return cls.Completed;
          }).reduce((acc, item) => {
            return (acc += item.Grants.Force);
          }, 0) + (this.Statistics["Force"] ? this.Statistics["Force"] : 0),
        Entropy:
          this.AscensionClasses.filter(cls => {
            return cls.Completed;
          }).reduce((acc, item) => {
            return (acc += item.Grants.Entropy);
          }, 0) + (this.Statistics["Entropy"] ? this.Statistics["Entropy"] : 0),
        Life:
          this.AscensionClasses.filter(cls => {
            return cls.Completed;
          }).reduce((acc, item) => {
            return (acc += item.Grants.Life);
          }, 0) + (this.Statistics["Life"] ? this.Statistics["Life"] : 0),
        Form:
          this.AscensionClasses.filter(cls => {
            return cls.Completed;
          }).reduce((acc, item) => {
            return (acc += item.Grants.Form);
          }, 0) + (this.Statistics["Form"] ? this.Statistics["Form"] : 0),
        Inertia:
          this.AscensionClasses.filter(cls => {
            return cls.Completed;
          }).reduce((acc, item) => {
            return (acc += item.Grants.Inertia);
          }, 0) + (this.Statistics["Inertia"] ? this.Statistics["Inertia"] : 0)
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
    });
  }

  resetClass(item) {
    item.reset();
    this.checkClasses();
  }

  checkClasses() {
    let recurse = false;
    this.AscensionClasses.forEach(item => {
      if (
        this.CurrentAscension.Force < item.Requires.Force ||
        this.CurrentAscension.Form < item.Requires.Form ||
        this.CurrentAscension.Entropy < item.Requires.Entropy ||
        this.CurrentAscension.Life < item.Requires.Life ||
        this.CurrentAscension.Inertia < item.Requires.Inertia
      ) {
        if (item.HasSelections) {
          item.reset();
          recurse = true;
        }
      }
    });
    if (recurse) {
      this.checkClasses();
    }
  }

  queryRaw(value) {}

  queryStats() {}

  queryActivation(value) {}

  queryModifiers() {}
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
  public get SelectedNode() {
    return this._selected
      ? this
      : this.SubNodes.filter(item => {
          return item.Selected;
        })[0];
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

  public hasStatistic(value) {
    return (
      this.Stats[value] ||
      this.SubNodes.reduce((acc, item) => {
        return acc || item.Stats[value];
      }, false)
    );
  }

  public hasRaw(value) {
    return (
      this.Raw.toUpperCase().indexOf(value.toUpperCase()) > -1 ||
      this.SubNodes.reduce((acc, item) => {
        return acc || item.Raw.toUpperCase().indexOf(value.toUpperCase()) > -1;
      }, false)
    );
  }

  public reset() {
    this._selected = false;
    this.SubNodes.forEach(node => {
      node.reset();
    });
  }
}

export class AscensionClass {
  public get Completed() {
    return this.Nodes.reduce((acc, item) => {
      return item.Selected && acc;
    }, true);
  }

  public get SelectedNodes() {
    return this.Nodes.reduce((acc, item) => {
      if (item.Selected) {
        acc.push(item.SelectedNode);
        acc.push(item);
      }
      return acc;
    }, []);
  }

  public get SelectedNodesFromPoints() {
    return this.Nodes.reduce((acc, item) => {
      if (item.Selected) {
        acc.push(item.SelectedNode);
      }
      return acc;
    }, []);
  }

  public get HasSelections() {
    return this.SelectedNodes[0];
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

  public hasStatistic(value) {
    return this.Nodes.reduce((acc, item) => {
      return acc || item.hasStatistic(value);
    }, false);
  }

  public hasRaw(value) {
    return this.Nodes.reduce((acc, item) => {
      return acc || item.hasRaw(value);
    }, false);
  }

  public reset() {
    this.Nodes.forEach(node => {
      node.reset();
    });
  }
}
