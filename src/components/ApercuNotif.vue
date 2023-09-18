<template>
<div>
  <div :class="dkli(idx)">
    <div v-if="notif" class="column q-my-sm">
      <q-expansion-item dense switch-toggle-side>
        <template v-slot:header>
          <q-toolbar :class="tclr + ' ' + bgclr">
            <q-icon size="sm" :name="ico" class="q-mr-sm"/>
            <q-toolbar-title v-if="tC !== 0" class="col titre-md">
              {{$t('ANcourt' + notif.niv, [$t('ANcible' + tC)])}}</q-toolbar-title>
            <q-btn color="warning" size="sm" class="btn2" :label="$t('gerer')"
              dense icon="edit" @click.stop="editer"/>
          </q-toolbar>
        </template>
        <detail-notif :ntf="notif"/>
      </q-expansion-item>

      <show-html class="q-mt-xs bord" :texte="notif.texte" :idx="idx" 
        maxh="3rem" zoom scroll/>
    </div>
    <div v-if="!notif && (pow < 4)" class="row justify-between">
      <notif-icon :niv="0" :cible="tC" info/>
      <q-btn v-if="editable" color="primary" class="q-ml-sm btn2" size="sm" 
        :label="$t('ANcre')"
        dense icon="edit" @click="editer"/>
    </div>
  </div>

  <q-dialog v-model="ouvert" full-height persistent>
    <div class="bs"  style="width:80vw">
    <q-layout container view="hHh lpR fFf" :class="dkli(0)">
      <q-header elevated class="bg-secondary text-white">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">
            {{$t('alerte') + ' ' + $t('ANcible' + tC + 'b', [nom])}}
          </q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-page class="q-pa-sm">
          <div v-if="ro > 0" class="q-pa-xs titre-md text-bold text-italic text-center text-warning bg-yellow-3">
            {{$t('ANro' + ro)}}
          </div>
          <div class="q-mt-sm row justify-between">
            <div class="titre-lg">{{$t('ANemet', [nomS])}}</div>
            <div class="fs-md font-mono">{{dhc}}</div>
          </div>

          <show-html class="q-mt-sm bord" scroll :texte="ntf.texte" :idx="idx" maxh="5rem" 
            :edit="ro===0" zoom @edit="ovtxtedit"/>

          <detail-notif :ntf="ntf"/>

          <div v-if="ro === 0">
            <q-separator color="orange" class="q-my-sm"/>
            <div v-if="ntf.jbl!==0">
              <div class="fs-md text-italic q-my-xs">{{$t('ANed0', [dp])}}</div>
              <div class="column q-ml-md q-gutter-sm">
                <q-radio dense v-model="choix" :val="1" :label="$t('ANed1')" />
                <q-radio dense v-model="choix" :val="2" :label="$t('ANed2')" />
                <q-radio dense v-model="choix" :val="3" :label="$t('ANed3')" />
              </div>
            </div>
            <div v-else>
              <q-radio dense v-model="choix" :val="4" :label="$t('ANed4')" />
            </div>
            <div v-if="choixdiag" class="text-bold text-negative fs-md bg-yellow-3">{{choixdiag}}</div>

            <div v-if="choix >= 3" class="fs-md q-my-sm row items-end">
              <span class ="q-mr-sm">{{$t('ANdp', [edd(ntf.jbl)])}}</span>
              <q-input dense clearable class="inp1" v-model.number="np" type="number"
               :label="$t('AN365')">
              </q-input>
            </div>

            <div v-if="ntf.jbl > 0" class="fs-md q-my-sm row items-end">
              <span class ="q-mr-sm">{{$t('ANd4')}}</span>
              <q-input dense clearable class="inp1" v-model.number="nj" type="number" 
                :label="$t('AN365')">
              </q-input>
            </div>

            <div class="row q-my-md q-gutter-lg">
              <q-btn flat color="primary" icon="close" dense size="md" 
                :label="$t('renoncer')" @click="MD.fD"/>
              <q-btn flat color="primary" icon="undo" dense size="md" 
                :disable="!chg" :label="$t('annuler')" @click="undo"/>
              <q-btn color="warning" icon="check" dense size="md" 
                :disable="choixdiag !== '' || !chg" :label="$t('valider')" @click="valider"/>
              <q-btn color="warning" icon="check" dense size="md" 
                :disable="ntf.dh===0" :label="$t('supprimer')" @click="valider(true)"/>
            </div>
          </div>
        </q-page>
      </q-page-container>
    </q-layout>
    </div>
  </q-dialog>

  <!-- Dialogue d'édition du texte de l'alerte -->
  <q-dialog v-model="txtedit" persistent>
    <editeur-md mh="10rem"  :titre="$t('ANtxt')" help="page1"
        :texte="ntf.texte || ''" editable modetxt :label-ok="$t('OK')" @ok="texteok"/>
  </q-dialog>

</div>
</template>
<script>

import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import NotifIcon from './NotifIcon.vue'
import BoutonHelp from './BoutonHelp.vue'
import EditeurMd from './EditeurMd.vue'
import ShowHtml from './ShowHtml.vue'
import DetailNotif from './DetailNotif.vue'
import { MD, Notification, getNg } from '../app/modele.mjs'
import { afficherDiag, dhcool, dkli } from '../app/util.mjs'
import { AMJ, ID } from '../app/api.mjs'
import { SetNotifG, SetNotifT, SetNotifC } from '../app/operations.mjs'

const txt = ['green-3', 'green-3', 'orange-9', 'negative', 'negative', 'negative']
const bg = ['none', 'none', 'yellow-1', 'yellow-2', 'yellow-5',  'yellow-7']
const ic = ['check', 'report', 'alarm_on', 'lock_open', 'lock', 'close']

export default {
  name: 'ApercuNotif',

  props: { 
    notif: Object, // notification existante, null pour création éventuelle
    idTribu: Number, // SAUF pour une notifG, tribu cible ou tribu du compte cible
    idCompte: Number,
    ns: Number, // id de l'espace
    nom: String, // nom de l'espace, de la tribu ou du compte
    idx: Number
  },

  components: { NotifIcon, BoutonHelp, EditeurMd, ShowHtml, DetailNotif },

  computed: {
    ico () { return ic[this.notif.niv || 0] },
    tclr () { return 'text-' + txt[this.notif.niv || 0]},
    bgclr () { return 'bg-' + bg[this.notif.niv || 0] },

    // Type de cible : 1:Global, 2:Tribu, 3:Compte
    tC () { return this.idCompte ? 3 : (this.ns ? 1 : 2) },

    // Type de l'auteur: 1:admin, 2:Comptable, 3:sponsor
    ta () { return !this.session.ns ? 1 : (this.session.estComptable ? 2 : 3)},

    // id de la tribu de l'auteur
    idtra () { return !this.session.ns ? 0 : this.aSt.tribu.id },

    moicible () {
      if (this.pow === 1) return ''
      if (this.tC === 2) return this.idtra === this.idTribu ? this.$t('ANdg1') : ''
      return this.session.compteId === this.idCompte ? this.$t('ANdg2') : ''
    },

    // Nom de la source
    nomS () { 
      if (!this.ntf.idSource) return this.$t('admin')
      const na = getNg(ID.long(this.ntf.idSource, this.session.ns))
      return na.nomc
    },
    dhc () { return this.ntf.dh ? dhcool(this.ntf.dh) : ''},

    dp () { return AMJ.editDeAmj(this.ntf.jbl, true) },
    chg () { return this.ntf.texte && (!this.notif || 
      (this.notif.jbl !== this.ntf.jbl) || 
      (this.notif.nj !== this.ntf.nj) ||
      (this.notif.texte !== this.ntf.texte))
    },

    editable () {
      if (this.pow === 1) { return this.tC === 1 }
      if (this.pow === 2 || this.pow === 3) { return this.tC > 1 }
      return false
    }
  },

  data () { return {
    ro: 0, // raison d'être en affichage sans édition
    choix: 0, // procédure en cours
    jbl: 0,
    np: 0,
    nj: 0,
    choixdiag: ''
  }},

  watch: {
    choix (ap, av) {
      switch (ap) {
      case 1: { // ajuster
        this.np = 0
        this.nj = this.ntf.nj
        this.choixdiag = this.moicible
        break
      }
      case 2: { // annuler
        this.ntf.jbl = 0
        this.ntf.nj = 0
        this.np = 0
        this.nj = 0
        this.choixdiag = ''
        break
      }
      case 3: { // réinit
        this.ntf.jbl = this.auj
        this.np = 0
        this.nj = this.ntf.nj
        this.choixdiag = this.moicible
        break
      }
      case 4: { // nouvelle
        this.ntf.jbl = this.auj
        this.ntf.nj = 30
        this.choix = 1
        break
      }
      }
      this.ntf.calcul()
    },
    np (ap, av) {
      const x = ap // ? parseInt(ap) : 0
      if (x < 0 || x > 365) return
      this.ntf.jbl = AMJ.amjUtcPlusNbj(this.auj, x)
      this.ntf.calcul()
    },
    nj (ap, av) {
      const x = ap // ? parseInt(ap) : 0
      if (x < 0 || x > 365) return
      this.ntf.nj = x
      this.ntf.calcul()
    },
  },

  methods: {
    edd (d) { return AMJ.editDeAmj(d, true) },
    texteok (t) { this.ntf.texte = t },

    undo () {
      this.ntf = this.ntfx ? this.ntfx.clone() : this.notif.clone()
      this.reset()
    },

    reset () {
      this.choix = this.ntf.jbl === 0 ? 0 : 1
    },

    async editer () {
      this.ro = -1
      this.choixdiag = ''
      if (this.pow === 1) await this.editerA()
      else if (this.pow === 2) await this.editerC()
      else await this.editerS()
      if (this.ro >= 0) {
        if (this.ro === 0) { this.ntfx = this.ntf.clone(); this.reset() }
        this.ovouvert()
      }
    },

    async editerA () { // Administrateur
      if (this.tC > 1) {
        // notification T ou C, pas éditable par admin
        if (this.notif){ 
          this.ntf = this.notif
          this.ro = 1
        } else {
          await afficherDiag(this.$t('ANmx1'))
        }
      } else { // Notification générale
        this.ntf = this.notif ? this.notif.clone() : new Notification(null, 0)
        this.ro = 0
      }
    },

    async editerC () { // Comptable
      if (!await this.session.edit(true)) return // TODO reprendre seul cas de edit(true)
      if (this.tC > 1) {
        this.ntf = this.notif ? this.notif.clone() : new Notification(null, this.session.compteId)
        this.ro = 0
      } else { // Notification générale
        if (this.notif) {
          this.ntf = this.notif
          this.ro = 2
        } else {
          await afficherDiag(this.$t('ANmx2'))        
        }
      }
    },

    async editerS () { // Compte standard ou sponsor de sa tribu
      if (!await this.session.edit()) return
      if (this.tC === 2) {
        // Notif de tribu
        if (this.notif) {
          if (this.session.estSponsor){
            if (ID.estComptable(ID.long(this.notif.idSource, this.session.ns))) {
              this.ntf = this.notif
              this.ro = 5
            } else {
              this.ntf = this.notif.clone()
              this.ro = 0
            }
          } else {
            this.ntf = this.notif
            this.ro = 4
          }
        } else { // création d'une notif tribu
          if (this.session.estSponsor){
            this.ntf = new Notification(null, this.session.compteId)
            this.ro = 0
          } else {
            await afficherDiag(this.$t('ANmx4')) 
          }
        }
      } else if (this.tC == 3) {
        // notif de compte
        if (this.notif) {
          if (this.session.estSponsor){
            if (ID.estComptable(ID.long(this.notif.idSource, this.session.ns))) {
              this.ntf = this.notif
              this.ro = 6
            } else {
              this.ntf = this.notif.clone()
              this.ro = 0
            }
          } else {
            this.ntf = this.notif
            this.ro = 7
          }
        } else { // création d'une notif compte
          if (this.session.estSponsor){
            this.ntf = new Notification(null, this.session.compteId)
            this.ro = 0
          } else {
            await afficherDiag(this.$t('ANmx7')) 
          }
        }
      } else { // Notification générale
        if (this.notif) {
          this.ntf = this.notif
          this.ro = 3
        } else {
          await afficherDiag(this.$t('ANmx3'))        
        }
      }
    },

    async valider (suppr) {
      const ntf = suppr === true ? null : this.ntf
      switch (this.tC) {
        case 1: { // notifG
          this.session.setNs(this.ns)
          await new SetNotifG().run(ntf)
          break
        }
        case 2: { // notif Tribu
          await new SetNotifT().run(this.idTribu, ntf)
          break
        }
        case 3: { // notif Compte
          await new SetNotifC().run(this.idTribu, this.idCompte, ntf)
          break
        }
      }
      MD.fD()
    }
  },

  setup () {
    const session = stores.session
    const pow = session.pow
    const aSt = stores.avatar
    const auj = AMJ.amjUtc()
    const ntf = ref(null)
    const ntfc = ref(null)

    const ouvert = ref(false)
    function ovouvert () { MD.oD(ouvert) }
    const txtedit = ref(false)
    function ovtxtedit () { MD.oD(txtedit) }

    return {
      MD, dkli, ouvert, ovouvert, txtedit, ovtxtedit,
      session, pow,
      aSt,
      auj,
      ntf,
      ntfc
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 2px
.inp1
  width: 5rem
.btn2
  max-height: 1.5rem
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
</style>
