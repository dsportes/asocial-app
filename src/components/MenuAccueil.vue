<template>
<q-list class="titre-md" style="min-width: 300px">
  <div v-if="bloc && !session.estComptable" 
    class="q-px-sm titre-md text-bold text-italic bg-yellow-5 text-warning cursor-pointer"
    @click="clickNotif2">{{$t('ACbloc')}}
  </div>

  <div v-if="!bloc">
    <q-item class="q-my-md" clickable @click="ui.setPage('notes')">
      <q-item-section>
        <q-item-label 
          class="titre-lg text-warning q-pa-xs bord9 text-bold text-center" 
          lines="1">{{$t('ACmesnotes')}}</q-item-label>
      </q-item-section>
    </q-item>
    <q-separator color="orange"/>
  </div>

  <q-item v-if="session.estComptable" clickable  @click="ui.setPage('espace')">
    <q-item-section>
      <q-item-label lines="1">{{$t('ACtribus')}}</q-item-label>
    </q-item-section>
  </q-item>

  <q-separator v-if="session.estComptable" color="orange"/>

  <div v-if="!bloc">
    <q-item clickable @click="ui.setPage('compte')">
      <q-item-section>
        <q-item-label lines="1">{{$t('ACmesav' + (session.estSponsor ? '1' : '2'))}}</q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable>
      <q-item-section clickable @click="ui.setPage('groupes')">
        <q-item-label>
          <span>{{$t('ACmesgr')}}
            <q-badge color="primary" rounded>{{nbgrpsT}}</q-badge>
          </span>
          <span class="q-ml-sm">{{$t('ACmesinv')}}
            <q-badge color="primary" rounded>{{nbInvits}}</q-badge>
          </span>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable @click="ui.setPage('people')">
      <q-item-section>
        <q-item-label lines="1">{{$t('ACmesctc')}}</q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable @click="tousChats">
      <q-item-section>
        <q-item-label lines="1">{{$t('ACchats')}}
          <q-badge color="primary" rounded>{{nbchats}}</q-badge>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item v-if="!aSt.compta.estA" clickable  @click="maTribu()">
      <q-item-section>
        <q-item-label lines="1">{{$t(session.pow <= 3 ? 'ACalloc' : 'ACspons')}}</q-item-label>
      </q-item-section>
    </q-item>
    <q-separator color="orange"/>

    <q-item class="row items-center">
      <span class="text-italic text-bold q-mr-sm">{{$t('ACav')}}</span>
      <q-select v-model="cav" borderless dense options-dense standard filled
        :options="options" style="max-width: 150px" behavior="menu"/>
    </q-item>

    <q-item clickable>
      <q-item-section class="q-ml-lg" clickable @click="ui.setPage('groupesac')">
        <q-item-label lines="1">{{$t('ACgroupes')}}
          <q-badge color="primary" rounded>{{nbgrps}}</q-badge>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable class="q-ml-lg" @click="chatsAv">
      <q-item-section>
        <q-item-label lines="1">{{$t('ACchats')}}
          <q-badge color="primary" rounded>{{nbchatsAv}}</q-badge>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable class="q-ml-lg" @click="ui.setPage('sponsorings')">
      <q-item-section>
        <q-item-label lines="1">{{$t('ACsponsorings')}}
          <q-badge color="primary" rounded>{{nbspons}}</q-badge>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-separator v-if="session.groupeId" class="q-my-xs" color="orange"/>

    <q-item v-if="session.groupeId" clickable @click="ui.setPage('groupe', 'groupe')">
      <span class="text-italic text-bold" style="position:relative;top:3px">{{$t('ACgr')}}</span>
      <q-btn class="q-ml-md text-bold" dense :label="gSt.egrC.groupe.na.nomc" no-caps
        icon-right="open_in_new" @click="ui.setPage('groupe', 'groupe')"/>
    </q-item>
    <q-item v-if="session.groupeId" clickable @click="ui.setPage('groupe', 'membres')">
      <q-item-section class="q-ml-lg">
        <q-item-label lines="1">{{$t('ACnotes')}}
        </q-item-label>
      </q-item-section>
    </q-item>
  </div>
</q-list>
</template>

<script>
import stores from '../stores/stores.mjs'

export default {
  name: 'MenuAccueil',

  props: { menu: Boolean },

  computed: {
    options () {
      const l = []
      this.aSt.map.forEach(e => { 
        const a = e.avatar
        l.push({ label: a.na.nom, value: a.id }) 
      })
      return l
    },

    nbchats () { return this.aSt.nbchats + this.gSt.nbchats },
    nbchatsAv () { return this.aSt.eavC.chats.size },
    nbspons () { return this.aSt.eavC.sponsorings.size },
    nbgrps () { 
      return this.aSt.compte.idGroupes(this.session.avatarId).size
    },
    nbgrpsT () { 
      return this.aSt.compte.idGroupes().size
    },
    nbInvits () { return this.gSt.invits.size },

    nbgrsecs () { return '?' },
    nbmbs () { return '?' },

    nbtav () { return this.aSt.compta.mav.size },
    nbtgr () { return this.gSt.map.size },
    nbtct () { return this.pSt.map.size },
    nbttr () { return this.aSt.nbTribus },
    nbtsp () { return 1 },
    nbtiv () { return 1 },
    bloc () { return this.session.estMinimal },
  },

  watch: {
    cav (ap) { this.session.setAvatarId(ap.value) }
  },

  methods: {
    clickNotif2 () {
      this.ui.setPage('compta', 'chats')
    },
    maTribu () { 
      this.aSt.setTribuC()
      this.ui.setPage('tranche')
    },
    chatsAv () {
      this.fSt.filtre.chats.tous = false
      this.ui.setPage('chats')
    },
    tousChats () {
      this.fSt.filtre.chats.tous = true
      this.ui.setPage('chats')
    }
  },

  data () {
    return {
      cav: { label: this.aSt.compte.na.nom, value: this.aSt.compte.na.id }
    }
  },

  setup () {
    return {
      aSt: stores.avatar,
      session: stores.session, 
      gSt: stores.groupe, 
      ui: stores.ui, 
      fSt: stores.filtre
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-item
  min-height: 20px !important
  padding: 3px 1rem !important
.bord9
  border: 2px solid $grey-5
  border-radius: 5px
</style>
