<template>
  <div :class="dkli(idx)">
    <div v-if="notif" class="row q-my-sm">
      <div class="titre-sm">{{$t('SBc' + tC, [nomC])}}</div>
      <div class="titre-sm q-ml-xs text-bold">{{$t('SBst' + blocage.niv)}}</div>
      <notif-icon :niveau="blocage.niv" class="q-ml-md cursor-pointer" @click="editer"/>
    </div>
    <div v-else>
      <div v-if="editable">
        <span class="titre-sm q-my-sm text-italic">{{$t('SNnon')}}</span>
        <q-btn color="primary" class="q-ml-sm btn2" size="sm" :label="$t('SBcre')"
          dense icon="edit" @click="editer"/>
      </div>
    </div>

  <q-dialog v-model="ouvert" full-height persistent>
    <q-layout container view="hHh lpR fFf" :class="dkli(0)" style="width:80vw">
      <q-header elevated class="bg-secondary text-white">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="close"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('APtitav', [aSt.avC.na.nom])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-card class="q-pa-sm largeur40">
          <apercu-avatar edit :na="aSt.avC.na"/>
        </q-card>
      </q-page-container>
    </q-layout>
  </q-dialog>

  </div>
</template>
<script>

import stores from '../stores/stores.mjs'
import NotifIcon from './NotifIcon.vue'
import { Notification } from '../app/modele.mjs'
import { afficherDiag } from '../app/util.mjs'
import { ID } from '../app/api.mjs'

export default {
  name: 'ApercuNotif',

  props: { 
    notif: Object, // notification existante, null pour création éventuelle
    naCible: Object, // NomTribu, NomAvatar ou null pour global de la notification à créer
    idx: Number
  },

  components: { NotifIcon },

  computed: {
    // Type de cible : 1:Global, 2:Tribu, 3:Compte
    tC () { return !this.naCible ? 1 : (this.naCible.estTribu ? 2 : 3) },
    nomC () { return this.tC === 1 ? this.$t('admin') : this.naCible.nom },
    // id de la source : 1:Admin, 2:Comptable, 3:Sponsor
    idS () { return !this.naSrc ? 0 : this.naSrc.id },
    nomS () { return !this.naSrc ? this.$t('admin') : this.naSrc.nom },
    // 
    edx () { return this.session.estComptable || this.blocage.sp },
  },

  data () { return {
    ntf: null, // notification en édition
    ouvert: false,
    ro: 0, // raison d'être en affichage sans édition
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },

    async editer () {
      this.ro = -1
      if (!session.ns) await editerA()
      else if (session.estComptable) await editerC()
      else await editerS()
      if (this.ro >= 0) this.ouvert = true
    },

    async editerA () { // Administrateur
      if (this.naCible) {
        // notification T ou C, pas éditable par admin
        if (this.notif){ 
          this.ntf = this.notif
          this.ro = 1
        } else {
          await afficherDiag(this.t('ANmx1'))
        }
      } else { // Notification générale
        this.ntf = this.notif ? this.notif.clone() :
          new Notification(null, 0, 0)
        this.ro = 0
      }
    },

    async editerC () { // Comptable
      if (this.naCible) {
        this.ntf = this.notif ? this.notif.clone() : 
          new Notification(null, session.compteId, this.naCible.id)
        this.ro = 0
      } else { // Notification générale
        if (this.notif) {
          this.ntf = this.notif
          this.ro = 2
        } else {
          await afficherDiag(this.t('ANmx2'))        
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
            this.ntf = new Notification(null, session.compteId, this.naCible.id)
            this.ro = 0
          } else {
            await afficherDiag(this.t('ANmx4')) 
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
            this.ntf = new Notification(null, session.compteId, this.naCible.id)
            this.ro = 0
          } else {
            await afficherDiag(this.t('ANmx7')) 
          }
        }
      } else { // Notification générale
        if (this.notif) {
          this.ntf = this.notif
          this.ro = 3
        } else {
          await afficherDiag(this.t('ANmx3'))        
        }
      }
    },

    close () { this.ouvert = false }
  },

  setup () {
    const session = stores.session
    return {
      session
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
