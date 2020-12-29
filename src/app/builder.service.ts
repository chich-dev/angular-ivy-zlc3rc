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

  public get HighestValueClasses() {
    if (this.SelectedClassTarget) {
      /*let ascensionDelta = {
        Force:
          this.CurrentAscension.Force - this.SelectedClassTarget.Requires.Force,
        Life:
          this.CurrentAscension.Life - this.SelectedClassTarget.Requires.Life,
        Entropy:
          this.CurrentAscension.Entropy -
          this.SelectedClassTarget.Requires.Entropy,
        Form:
          this.CurrentAscension.Form - this.SelectedClassTarget.Requires.Form,
        Inertia:
          this.CurrentAscension.Inertia -
          this.SelectedClassTarget.Requires.Inertia
      };*/
      let ascensionDelta = {
        Force:
          this.CurrentAscension.Force - this.SelectedClassTarget.Requires.Force,
        Life:
          this.CurrentAscension.Life - this.SelectedClassTarget.Requires.Life,
        Entropy:
          this.CurrentAscension.Entropy -
          this.SelectedClassTarget.Requires.Entropy,
        Form:
          this.CurrentAscension.Form - this.SelectedClassTarget.Requires.Form,
        Inertia:
          this.CurrentAscension.Inertia -
          this.SelectedClassTarget.Requires.Inertia
      };
      /*return this.AvailableClasses.sort((a, b) => {
        let aScore = 0;
        let bScore = 0;
        for (var name in ascensionDelta) {
          if (ascensionDelta[name] < 0) {
            aScore += a.Grants[name];
            aScore += b.Grants[name];
          }
        }
        return aScore == bScore ? 0 : aScore < bScore ? 1 : -1;
      });*/
      return this.NonCompletedClasses.sort((a, b) => {
        let aScore = 0;
        let bScore = 0;
        for (var name in ascensionDelta) {
          let aExclusiveGrantUsed = false;
          let bExclusiveGrantUsed = false;

          if (ascensionDelta[name] < 0) {
            if (a.HasExclusiveGrant) {
              if (aExclusiveGrantUsed) {
                aScore +=
                  a.Grants[name] > Math.abs(ascensionDelta[name])
                    ? Math.abs(ascensionDelta[name])
                    : a.Grants[name];
              } else {
                if (a.Grants[name] + 1 > Math.abs(ascensionDelta[name])) {
                  aScore += Math.abs(ascensionDelta[name]);
                } else {
                  aScore += a.Grants[name] + 1;
                  aExclusiveGrantUsed = true;
                }
              }
            } else {
              aScore +=
                a.Grants[name] > Math.abs(ascensionDelta[name])
                  ? Math.abs(ascensionDelta[name])
                  : a.Grants[name];
            }
            if (b.HasExclusiveGrant) {
              if (bExclusiveGrantUsed) {
                bScore +=
                  b.Grants[name] > Math.abs(ascensionDelta[name])
                    ? Math.abs(ascensionDelta[name])
                    : b.Grants[name];
              } else {
                if (b.Grants[name] + 1 > Math.abs(ascensionDelta[name])) {
                  bScore += Math.abs(ascensionDelta[name]);
                } else {
                  bScore += b.Grants[name] + 1;
                  bExclusiveGrantUsed = true;
                }
              }
            } else {
              bScore +=
                b.Grants[name] > Math.abs(ascensionDelta[name])
                  ? Math.abs(ascensionDelta[name])
                  : b.Grants[name];
            }
          }
        }
        if (
          (a.Name == "The Hind" && b.Name == "The Arcanist") ||
          (b.Name == "The Hind" && a.Name == "The Arcanist")
        ) {
          console.log(aScore);
          console.log(bScore);
          console.log(b.HasExclusiveGrant);
        }

        return aScore == bScore ? 0 : aScore < bScore ? 1 : -1;
      });
    } else {
      return [];
    }
  }

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

  public get GrantsFocus() {
    if (this.AscensionClasses) {
      return this.AscensionClasses.filter(cls => {
        return (
          cls.Grants["Focus"] > 0 ||
          cls.Nodes.filter(node => {
            return (
              node.Stats["Focus"] ||
              node.SubNodes.filter(subnode => {
                return subnode.Stats["Focus"];
              })[0]
            );
          })[0]
        );
      });
    } else {
      return [];
    }
  }

  public get GrantsLife() {
    if (this.AscensionClasses) {
      return this.AscensionClasses.filter(cls => {
        return (
          cls.Grants["Life"] > 0 ||
          cls.Nodes.filter(node => {
            return (
              node.Stats["Life"] ||
              node.SubNodes.filter(subnode => {
                return subnode.Stats["Life"];
              })[0]
            );
          })[0]
        );
      });
    } else {
      return [];
    }
  }

  public get GrantsForce() {
    if (this.AscensionClasses) {
      return this.AscensionClasses.filter(cls => {
        return (
          cls.Grants["Force"] > 0 ||
          cls.Nodes.filter(node => {
            return (
              node.Stats["Force"] ||
              node.SubNodes.filter(subnode => {
                return subnode.Stats["Force"];
              })[0]
            );
          })[0]
        );
      });
    } else {
      return [];
    }
  }

  public get GrantsEntropy() {
    if (this.AscensionClasses) {
      return this.AscensionClasses.filter(cls => {
        return (
          cls.Grants["Entropy"] > 0 ||
          cls.Nodes.filter(node => {
            return (
              node.Stats["Entropy"] ||
              node.SubNodes.filter(subnode => {
                return subnode.Stats["Entropy"];
              })[0]
            );
          })[0]
        );
      });
    } else {
      return [];
    }
  }

  public get GrantsInertia() {
    if (this.AscensionClasses) {
      return this.AscensionClasses.filter(cls => {
        return (
          cls.Grants["Inertia"] > 0 ||
          cls.Nodes.filter(node => {
            return (
              node.Stats["Inertia"] ||
              node.SubNodes.filter(subnode => {
                return subnode.Stats["Inertia"];
              })[0]
            );
          })[0]
        );
      });
    } else {
      return [];
    }
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

  public get NonCompletedClasses() {
    if (this.AscensionClasses) {
      return this.AscensionClasses.filter(cls => {
        return !cls.Completed;
      });
    } else {
      return [];
    }
  }

  public get RootClasses() {
    if (this.AscensionClasses) {
      return this.AscensionClasses.slice(0, 5);
    } else {
      return [];
    }
  }

  public get LastTierClasses() {
    if (this.AscensionClasses) {
      return this.AscensionClasses.filter(item => {
        return (
          Object.keys(item.Grants).reduce((acc, key) => {
            acc += item.Grants[key];
            return acc;
          }, 0) == 0
        );
      });
    } else {
      return [];
    }
  }

  private _SelectedClassTarget;
  public set SelectedClassTarget(value) {
    this._SelectedClassTarget = value;
    this._SelectedClassTarget
      ? (this.Paths = this.getPathsToClass(value))
      : (this.Paths = null);
  }
  public get SelectedClassTarget() {
    return this._SelectedClassTarget;
  }

  private _Paths;
  public set Paths(value) {
    this._Paths = value;
  }
  public get Paths() {
    return this._Paths;
  }

  constructor(private http: HttpClient) {
    this.http.get("/assets/ascension.json").subscribe(data => {
      this.AscensionClasses = (data as Array<any>).map(cls => {
        return new AscensionClass(cls);
      });
    });
  }

  getPathsToClass(cls) {
    let result = [];

    return result;
  }

  getAvailableClassesFromPoint(ascension) {
    return this.AscensionClasses.filter(cls => {
      return (
        !cls.Completed &&
        ascension.Force >= cls.Requires.Force &&
        ascension.Entropy >= cls.Requires.Entropy &&
        ascension.Life >= cls.Requires.Life &&
        ascension.Form >= cls.Requires.Form &&
        ascension.Inertia >= cls.Requires.Inertia
      );
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

  public get HasExclusiveGrant() {
    return this.SubNodes.reduce((acc, item) => {
      return (
        acc ||
        item.Stats["Life"] ||
        item.Stats["Form"] ||
        item.Stats["Force"] ||
        item.Stats["Entropy"] ||
        item.Stats["Inertia"]
      );
    }, false);
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

  public get MaxGrants() {
    return {
      Force:
        (this.Stats["Force"] ? this.Stats["Force"] : 0) +
        this.SubNodes.reduce((acc, item) => {
          acc += item.MaxGrants["Force"];
          return acc;
        }, 0),
      Inertia:
        (this.Stats["Inertia"] ? this.Stats["Inertia"] : 0) +
        this.SubNodes.reduce((acc, item) => {
          acc += item.MaxGrants["Inertia"];
          return acc;
        }, 0),
      Life:
        (this.Stats["Life"] ? this.Stats["Life"] : 0) +
        this.SubNodes.reduce((acc, item) => {
          acc += item.MaxGrants["Life"];
          return acc;
        }, 0),
      Form:
        (this.Stats["Form"] ? this.Stats["Form"] : 0) +
        this.SubNodes.reduce((acc, item) => {
          acc += item.MaxGrants["Form"];
          return acc;
        }, 0),
      Entropy:
        (this.Stats["Entropy"] ? this.Stats["Entropy"] : 0) +
        this.SubNodes.reduce((acc, item) => {
          acc += item.MaxGrants["Entropy"];
          return acc;
        }, 0)
    };
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

  public get HasExclusiveGrant() {
    return this.Nodes.reduce((acc, item) => {
      return acc || item.HasExclusiveGrant;
    }, false);
  }

  public get MaxGrants() {
    return {
      Force:
        this.Grants.Force +
        this.Nodes.reduce((acc, item) => {
          acc += item.MaxGrants["Force"];
          return acc;
        }, 0),
      Life:
        this.Grants.Life +
        this.Nodes.reduce((acc, item) => {
          acc += item.MaxGrants["Life"];
          return acc;
        }, 0),
      Form:
        this.Grants.Form +
        this.Nodes.reduce((acc, item) => {
          acc += item.MaxGrants["Form"];
          return acc;
        }, 0),
      Entropy:
        this.Grants.Entropy +
        this.Nodes.reduce((acc, item) => {
          acc += item.MaxGrants["Entropy"];
          return acc;
        }, 0),
      Inertia:
        this.Grants.Inertia +
        this.Nodes.reduce((acc, item) => {
          acc += item.MaxGrants["Inertia"];
          return acc;
        }, 0)
    };
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
