<template>
<div>
  <div :class="dkli(idx)">
    <div v-if="notif" class="column q-my-sm">
      <div class="row justify-between">
        <notif-icon :niv="notif.niv" :cible="tC" info/>
        <q-btn color="primary" class="q-ml-sm btn2" size="sm" :label="$t('ANplus')"
          dense icon="edit" @click="editer"/>
      </div>
      <show-html class="q-mt-sm bord" :texte="notif.texte" :idx="idx" maxh="3rem" zoom/>
    </div>
    <div v-else class="row justify-between">
      <notif-icon :niv="0" :cible="tC" info/>
      <q-btn color="primary" class="q-ml-sm btn2" size="sm" :label="$t('ANcre')"
        dense icon="edit" @click="editer"/>
    </div>
  </div>

  <q-dialog v-model="ouvert" full-height persistent>
    <q-layout container view="hHh lpR fFf" :class="dkli(0)" style="width:80vw">
      <q-header elevated class="bg-secondary text-white">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="close"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">
            {{$t('alerte') + ' ' + $t('ANcible' + tC, [nomC])}}
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

          <show-html class="q-mt-sm bord" :texte="ntf.texte" :idx="idx" maxh="5rem" 
            :edit="ro===0" zoom @edit="txtedit=true"/>

          <div class="q-mt-sm titre-md text-bold">
            <span v-if="ntf.niv<2">{{$t('ANlon' + ntf.niv)}}</span>
            <span v-if="ntf.niv===2" class="text-warning bg-yellow-3">{{$t('ANlon' + ntf.niv)}}</span>
            <span v-if="ntf.niv>2" class="text-negative bg-yellow-5">{{$t('ANlon' + ntf.niv)}}</span>
          </div>
          <div v-if="ntf.niv>1 && ntf.niv<5" class="q-my-xs titre-sm text-italic">{{$t('ANlong' + ntf.niv)}}</div>

          <div style="height:4rem">
          <div v-if="ntf.n3 > 0" class="q-ml-md titre-md">
            {{$t('ANlon3') + ' ' + $t('ANle', [edd(ntf.jbl), ntf.n3])}}</div>
          <div v-if="ntf.n4 > 0" class="q-ml-md titre-md">
            {{$t('ANlon4') + ' ' + $t('ANle', [edd(ntf.d4), ntf.n4])}}</div>
          <div v-if="ntf.n5 > 0" class="q-ml-md titre-md">
            {{$t('ANlon5') + ' ' + $t('ANle', [edd(ntf.d5), ntf.n5])}}</div>
          </div>

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
                :label="$t('renoncer')" @click="close"/>
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
  </q-dialog>

  <!-- Dialogue d'édition du texte de l'alerte -->
  <q-dialog v-model="txtedit" persistent>
    <q-card class="petitelargeur shadow-8">
      <q-toolbar class="bg-secondary text-white">
        <q-toolbar-title class="titre-lg full-width">{{$t('ANtxt')}}</q-toolbar-title>
        <q-btn dense flat size="md" icon="close" @click="txtedit=false"/>
      </q-toolbar>
      <editeur-md class="height-10"
        :texte="ntf.texte || ''" editable modetxt :label-ok="$t('OK')" @ok="texteok"/>
    </q-card>
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
import { Notification, getNg } from '../app/modele.mjs'
import { afficherDiag, dhcool } from '../app/util.mjs'
import { AMJ, ID } from '../app/api.mjs'
import { SetNotifG, SetNotifT, SetNotifC } from '../app/operations.mjs'

export default {
  name: 'ApercuNotif',

  props: { 
    notif: Object, // notification existante, null pour création éventuelle
    naTribu: null, // SAUF pour une notifG, tribu cible ou tribu du compte cible
    naCible: Object, // NomTribu, NomAvatar ou null / undefined pour global de la notification à créer
    ns: Number, // id de l'espace, uniquement pour maj de notifG depuis PageAdmin 
    idx: Number
  },

  components: { NotifIcon, BoutonHelp, EditeurMd, ShowHtml },

  computed: {
    // Type de cible : 1:Global, 2:Tribu, 3:Compte
    tC () { return !this.naCible ? 1 : (this.naCible.estTribu ? 2 : 3) },
    nomC () { return !this.naCible ? '' : this.naCible.nom },

    // Type de l'auteur: 1:admin, 2:Comptable, 3:sponsor
    ta () { return !this.session.ns ? 1 : (this.session.estComptable ? 2 : 3)},

    // id de la tribu de l'auteur
    idtra () { return !this.session.ns ? 0 : this.aSt.tribu.id },

    moicible () {
      if (this.ta === 1) return ''
      if (this.tC === 2) return this.idtra === this.naTribu.id ? this.$t('ANdg1') : ''
      return this.session.compteId === this.naCible.id ? this.$t('ANdg2') : ''
    },

    // Nom de la source
    nomS () { const na = getNg(this.ntf.idSource); return !this.ntf.idSource ? this.$t('admin') : na.nomc },
    dhc () { return this.ntf.dh ? dhcool(this.ntf.dh) : ''},

    dp () { return AMJ.editDeAmj(this.ntf.jbl, true) },
    chg () { return this.ntf.texte && (!this.notif || 
      (this.notif.jbl !== this.ntf.jbl) || 
      (this.notif.nj !== this.ntf.nj) ||
      (this.notif.texte !== this.ntf.texte))
    }
  },

  data () { return {
    txtedit: false,
    ouvert: false,
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
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },

    edd (d) { return AMJ.editDeAmj(d, true) },
    texteok (t) { this.ntf.texte = t; this.txtedit = false },

    undo () {
      this.ntf = this.ntfx ? this.ntfx.clone() : this.notif.clone()
      this.reset()
    },

    reset () {
      this.choix = this.ntf.jbl === 0 ? 0 : 1
    },

    async editer () {
      this.ro = -1
      if (this.ta === 1) await this.editerA()
      else if (this.ta === 2) await this.editerC()
      else await this.editerS()
      if (this.ro >= 0) {
        if (this.ro === 0) { this.ntfx = this.ntf.clone(); this.reset() }
        this.ouvert = true
      }
    },

    async editerA () { // Administrateur
      if (this.naCible) {
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
      if (!await this.session.edit(true)) return
      if (this.naCible) {
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
      if (this.naCible.estTribu) {
        // Notif de tribu
        if (this.notif) {
          if (this.session.estSponsor){
            if (ID.estComptable(this.notif.idSource)) {
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
      } else if (this.naCible.estCompte) {
        // notif de compte
        if (this.notif) {
          if (this.session.estSponsor){
            if (ID.estComptable(this.notif.idSource)) {
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

    close () { this.ouvert = false },

    async valider (suppr) {
      const ntf = suppr === true ? null : this.ntf
      switch (this.tC) {
        case 1: { // notifG
          await new SetNotifG().run(this.ns, ntf)
          break
        }
        case 2: { // notif Tribu
          await new SetNotifT().run(this.naTribu.id, ntf)
          break
        }
        case 3: { // notif Compte
          await new SetNotifC().run(this.naTribu.id, this.naCible, ntf)
          break
        }
      }
      this.close()
    }
  },

  setup () {
    const session = stores.session
    const aSt = stores.avatar
    const auj = AMJ.amjUtc()
    const ntf = ref(null)
    const ntfc = ref(null)
    return {
      session,
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
</style>
